import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { trace, SpanStatusCode, context as otelContext } from '@opentelemetry/api'
import { 
  computeIdfForTags, 
  buildSparseVectorTfidf, 
  parseTags, 
  computePromptBayesian, 
  computePromptPopularity, 
  normalizePopularity, 
  SparseVector,
} from '@/lib/recommend'
import { ViewsService } from '@/lib/services/viewsService'
import { 
  getUserProfile, 
  computePersonalizedScore, 
  applyDiversityPenalty,
  PROFILE_CONFIG,
} from '@/lib/services/userProfileService'
import { logAudit } from '@/lib/services/interactionService'

export const dynamic = 'force-dynamic'

const tracer = trace.getTracer('prompthub-recommendations')

// ============ КОНФИГУРАЦИЯ ============
const RECO_CONFIG = {
  // Веса для финального скоринга
  WEIGHTS: {
    personalization: 0.45,  // Персонализированный score
    popularity: 0.25,       // Популярность
    bayesian: 0.20,         // Байесовский рейтинг
    freshness: 0.10,        // Новизна
  },
  
  // Кэш
  CACHE_TTL_SECONDS: 60, // 1 минута для персонализированных
  COLD_START_CACHE_TTL_SECONDS: 300, // 5 минут для cold-start
  
  // Количество кандидатов для ранжирования
  CANDIDATES_LIMIT: 200,
  
  // Количество результатов
  RESULTS_LIMIT: 12,
  
  // Freshness decay (дней до полного угасания)
  FRESHNESS_DECAY_DAYS: 30,
}

interface RecommendationMetrics {
  requestId: string
  userId: string | null
  isPersonalized: boolean
  cacheHit: boolean
  candidatesCount: number
  scoringTimeMs: number
  totalTimeMs: number
  profileInteractions: number
}

/**
 * GET /api/recommendations
 * 
 * Query params:
 * - for: userId для которого генерируем рекомендации
 * - locale: язык интерфейса
 * - limit: количество результатов (default 12)
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()

  return tracer.startActiveSpan('reco.request', async (span) => {
    const metrics: Partial<RecommendationMetrics> = {
      requestId,
      cacheHit: false,
    }

    try {
      const url = new URL(req.url)
      const forUserId = url.searchParams.get('for') || undefined
      const locale = url.searchParams.get('locale') || undefined
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50)
      const search = url.searchParams.get('q') || undefined // Добавляем поддержку поиска
      
      span.setAttributes({
        'reco.request_id': requestId,
        'reco.for_user': forUserId || 'anonymous',
        'reco.locale': locale || 'default',
        'reco.limit': limit,
        'reco.search': search || '',
      })
      
      // ============ ПРОВЕРКА АВТОРИЗАЦИИ ============
      // Если указан "for", проверяем что это текущий пользователь или админ
      const session = await auth().catch(() => null)
      const sessionUserId = session?.user?.id
      
      if (forUserId && sessionUserId && forUserId !== sessionUserId) {
        // Проверяем, является ли пользователь админом
        const adminUser = await prisma.adminUser.findUnique({
          where: { userId: sessionUserId },
          select: { id: true },
        })
        
        if (!adminUser) {
          logAudit({
            event: 'reco.unauthorized',
            userId: sessionUserId,
            success: false,
            reason: 'USER_MISMATCH',
            metadata: { requestedFor: forUserId },
            timestamp: new Date(),
            requestId,
          })
          
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unauthorized' })
          return NextResponse.json({ error: 'Unauthorized: for must match session user' }, { status: 403 })
        }
      }
      
      const targetUserId = forUserId || sessionUserId
      metrics.userId = targetUserId || null
      
      // ============ ПРОВЕРКА КЭША ============
      const redis = await getRedis()
      const cacheKey = targetUserId
        ? `reco:user:${targetUserId}:${limit}:${search || ''}`
        : `reco:cold:${locale || 'default'}:${limit}:${search || ''}`
      
      const cached = await redis.get(cacheKey)
      if (cached) {
        metrics.cacheHit = true
        span.setAttribute('reco.cache_hit', true)
        
        logStructuredMetrics('reco.cache_hit', {
          ...metrics,
          totalTimeMs: Date.now() - startTime,
        } as RecommendationMetrics)
        
        span.setStatus({ code: SpanStatusCode.OK })
        return NextResponse.json(JSON.parse(cached))
      }
      
      // ============ ЗАГРУЗКА КАНДИДАТОВ ============
      const scoringStart = Date.now()

      let prompts: any[]

      if (search) {
        // Если есть поисковый запрос, используем текстовый поиск для консистентности
        const { enhancedSearch } = await import('@/lib/search-enhanced')
        const searchResult = await enhancedSearch({
          query: search,
          limit: RECO_CONFIG.CANDIDATES_LIMIT * 2, // Берем больше для лучшего ранжирования
          sort: 'relevance',
          order: 'desc'
        })
        prompts = searchResult.items
      } else {
        // Обычные рекомендации на основе векторов
        prompts = await prisma.prompt.findMany({
          include: {
            ratings: { select: { value: true } },
            _count: { select: { likes: true, saves: true, comments: true, ratings: true } },
            author: { select: { name: true } },
          },
          take: RECO_CONFIG.CANDIDATES_LIMIT,
          orderBy: { updatedAt: 'desc' }, // Приоритет свежим
        })
      }
      
      metrics.candidatesCount = prompts.length
      span.setAttribute('reco.candidates_count', prompts.length)
      
      // ============ ПОЛУЧЕНИЕ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ ============
      let userProfile = null
      if (targetUserId) {
        userProfile = await getUserProfile(targetUserId)
        metrics.profileInteractions = userProfile.interactionCount
        span.setAttribute('reco.profile_interactions', userProfile.interactionCount)
      }
      
      const isPersonalized = userProfile?.isPersonalized || false
      metrics.isPersonalized = isPersonalized
      span.setAttribute('reco.is_personalized', isPersonalized)
      
      // ============ ПОДСЧЕТ VIEWS ============
      const promptIds = prompts.map((p) => p.id)
      const viewTotals = await ViewsService.getPromptsViews(promptIds)
      
      // ============ СКОРИНГ ============
      let scored: any[]

      if (search) {
        // Для поиска используем простое ранжирование по релевантности
        const { calculateRelevanceScore, extractSearchTerms } = await import('@/lib/search-enhanced')
        const searchTerms = extractSearchTerms(search)

        scored = prompts.map((p) => ({
          id: p.id,
          score: calculateRelevanceScore(p, searchTerms),
          vector: null, // Не нужен для текстового поиска
          prompt: {
            ...p,
            views: viewTotals.get(p.id) ?? (p as any).views ?? 0,
          },
          debug: {
            relevance: calculateRelevanceScore(p, searchTerms),
          },
        }))
      } else {
        // Обычные рекомендации с векторным скорингом
        const idf = computeIdfForTags(prompts as any)

        // Вычисляем popularity values для нормализации
        const popularityValues = prompts.map((p) =>
          computePromptPopularity({
            _count: p._count as any,
            totalRatings: p.totalRatings,
            averageRating: p.averageRating,
          } as any)
        )

        const now = Date.now()
        const freshnessDecayMs = RECO_CONFIG.FRESHNESS_DECAY_DAYS * 24 * 60 * 60 * 1000

        scored = prompts.map((p) => {
          // Строим вектор промпта
          const promptVector = buildSparseVectorTfidf(
            { tags: parseTags(p.tags), category: p.category, model: p.model, lang: p.lang },
            idf
          )

          // Персонализированный score
          let personalizationScore = 0.5 // default для cold-start
          let seenPenalty = 1

          if (userProfile && isPersonalized) {
            const personalizedResult = computePersonalizedScore(promptVector, userProfile, p.id)
            personalizationScore = personalizedResult.similarity
            seenPenalty = personalizedResult.seenPenalty
          }

          // Байесовский рейтинг
          const bayesian = computePromptBayesian({
            id: p.id,
            tags: p.tags,
            category: p.category,
            model: p.model,
            lang: p.lang,
            ratings: p.ratings as any,
            _count: p._count as any,
            averageRating: p.averageRating,
            totalRatings: p.totalRatings,
          } as any)

          // Popularity
          const pop = computePromptPopularity({ _count: p._count as any, totalRatings: p.totalRatings, averageRating: p.averageRating } as any)
          const popNorm = normalizePopularity(popularityValues, pop)

          // Freshness (экспоненциальный decay)
          const ageMs = now - p.updatedAt.getTime()
          const freshness = Math.exp(-ageMs / freshnessDecayMs)

          // Финальный score
          const rawScore =
            RECO_CONFIG.WEIGHTS.personalization * personalizationScore +
            RECO_CONFIG.WEIGHTS.popularity * popNorm +
            RECO_CONFIG.WEIGHTS.bayesian * (bayesian / 5) +
            RECO_CONFIG.WEIGHTS.freshness * freshness

          const finalScore = rawScore * seenPenalty

          return {
            id: p.id,
            score: finalScore,
            vector: promptVector,
            prompt: {
              ...p,
              views: viewTotals.get(p.id) ?? (p as any).views ?? 0,
            },
            debug: {
              personalization: personalizationScore,
              popularity: popNorm,
              bayesian: bayesian / 5,
              freshness,
              seenPenalty,
            },
          }
        })
      }
      
      // ============ DIVERSITY RERANKING ============
      let finalResults: any[]

      if (search) {
        // Для поиска просто сортируем по релевантности и берем топ
        finalResults = scored
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((s) => ({
            id: s.id,
            score: s.score,
            prompt: s.prompt,
          }))
      } else {
        // Для рекомендаций применяем diversity reranking
        const diversified = applyDiversityPenalty(
          scored.map((s) => ({ id: s.id, score: s.score, vector: s.vector })),
          limit
        )

        // Собираем финальный результат
        const scoreMap = new Map(scored.map((s) => [s.id, s]))
        finalResults = diversified.map((d) => {
          const original = scoreMap.get(d.id)!
          return {
            id: d.id,
            score: d.score,
            prompt: original.prompt,
          }
        })
      }
      
      const scoringTimeMs = Date.now() - scoringStart
      metrics.scoringTimeMs = scoringTimeMs
      span.setAttribute('reco.scoring_time_ms', scoringTimeMs)
      
      // ============ КЭШИРОВАНИЕ ============
      const cacheTtl = isPersonalized 
        ? RECO_CONFIG.CACHE_TTL_SECONDS 
        : RECO_CONFIG.COLD_START_CACHE_TTL_SECONDS
      
      await redis.set(cacheKey, JSON.stringify(results), 'EX', cacheTtl)
      
      // ============ ЛОГИРОВАНИЕ ============
      const totalTimeMs = Date.now() - startTime
      metrics.totalTimeMs = totalTimeMs
      
      logStructuredMetrics('reco.request', metrics as RecommendationMetrics)
      
      logger.info({
        requestId,
        event: 'reco.success',
        userId: targetUserId || 'anonymous',
        isPersonalized,
        candidatesCount: prompts.length,
        resultsCount: results.length,
        scoringTimeMs,
        totalTimeMs,
      }, `Recommendations generated in ${totalTimeMs}ms`)
      
      span.setStatus({ code: SpanStatusCode.OK })
      return NextResponse.json(results)
      
    } catch (error) {
      const totalTimeMs = Date.now() - startTime
      
      logger.error({ 
        error, 
        requestId,
        totalTimeMs,
      }, 'GET /api/recommendations error')
      
      logAudit({
        event: 'reco.error',
        userId: metrics.userId || 'unknown',
        success: false,
        reason: String(error),
        timestamp: new Date(),
        requestId,
      })
      
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) })
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    } finally {
      span.end()
    }
  })
}

/**
 * Структурированные метрики для мониторинга
 */
function logStructuredMetrics(event: string, metrics: RecommendationMetrics): void {
  logger.info({
    metric: true,
    event,
    requestId: metrics.requestId,
    userId: metrics.userId,
    isPersonalized: metrics.isPersonalized,
    cacheHit: metrics.cacheHit,
    candidatesCount: metrics.candidatesCount,
    scoringTimeMs: metrics.scoringTimeMs,
    totalTimeMs: metrics.totalTimeMs,
    profileInteractions: metrics.profileInteractions,
  }, `[METRIC] ${event}`)
}
