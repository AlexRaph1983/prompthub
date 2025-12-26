/**
 * Сервис профиля пользователя для рекомендаций
 * Строит векторный профиль на основе истории взаимодействий
 */

import { prisma } from '@/lib/prisma'
import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { 
  SparseVector, 
  parseTags, 
  buildSparseVectorTfidf,
  cosineSimilarity,
  computeIdfForTags,
} from '@/lib/recommend'
import { INTERACTION_CONFIG } from './interactionService'

// ============ КОНФИГУРАЦИЯ ============
export const PROFILE_CONFIG = {
  // Время жизни кэша профиля (секунды)
  CACHE_TTL_SECONDS: 300, // 5 минут
  
  // Максимум взаимодействий для анализа
  MAX_INTERACTIONS_FOR_PROFILE: 200,
  
  // Период для анализа (дни)
  PROFILE_LOOKBACK_DAYS: 90,
  
  // Веса по типу взаимодействия для профиля
  PROFILE_WEIGHTS: {
    copy: 1.0,      // Копирование - самый сильный сигнал
    save: 0.9,      // Сохранение
    like: 0.8,      // Лайк
    rate: 0.7,      // Оценка
    comment: 0.6,   // Комментарий
    open: 0.3,      // Открытие детальной страницы
    view: 0.1,      // Просмотр в списке
  } as Record<string, number>,
  
  // Штраф за уже просмотренные промпты
  SEEN_PENALTY: 0.3, // умножается на score
  
  // Бонус за diversity (разнообразие)
  DIVERSITY_BONUS: 0.1,
  
  // Decay half-life в днях
  DECAY_HALF_LIFE_DAYS: 14,
  
  // Минимум взаимодействий для персонализации (иначе cold-start)
  MIN_INTERACTIONS_FOR_PERSONALIZATION: 3,
}

export interface UserProfile {
  userId: string
  vector: SparseVector
  interactionCount: number
  topCategories: string[]
  topTags: string[]
  topModels: string[]
  seenPromptIds: Set<string>
  isPersonalized: boolean // true если достаточно данных
  lastUpdated: Date
}

export interface ProfileCacheEntry {
  vector: SparseVector
  interactionCount: number
  topCategories: string[]
  topTags: string[]
  topModels: string[]
  seenPromptIds: string[]
  isPersonalized: boolean
  lastUpdated: string
}

/**
 * Получить или построить профиль пользователя
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const redis = await getRedis()
  const cacheKey = `user:profile:${userId}`
  
  // Пробуем получить из кэша
  const cached = await redis.get(cacheKey)
  if (cached) {
    try {
      const parsed: ProfileCacheEntry = JSON.parse(cached)
      logger.debug({ userId, cached: true }, 'User profile loaded from cache')
      return {
        userId,
        vector: parsed.vector,
        interactionCount: parsed.interactionCount,
        topCategories: parsed.topCategories,
        topTags: parsed.topTags,
        topModels: parsed.topModels,
        seenPromptIds: new Set(parsed.seenPromptIds),
        isPersonalized: parsed.isPersonalized,
        lastUpdated: new Date(parsed.lastUpdated),
      }
    } catch {
      // Невалидный кэш, перестроим
    }
  }
  
  // Строим профиль
  const profile = await buildUserProfile(userId)
  
  // Кэшируем
  const cacheEntry: ProfileCacheEntry = {
    vector: profile.vector,
    interactionCount: profile.interactionCount,
    topCategories: profile.topCategories,
    topTags: profile.topTags,
    topModels: profile.topModels,
    seenPromptIds: Array.from(profile.seenPromptIds),
    isPersonalized: profile.isPersonalized,
    lastUpdated: profile.lastUpdated.toISOString(),
  }
  
  await redis.set(cacheKey, JSON.stringify(cacheEntry), 'EX', PROFILE_CONFIG.CACHE_TTL_SECONDS)
  
  logger.debug({ userId, interactionCount: profile.interactionCount }, 'User profile built and cached')
  return profile
}

/**
 * Построить профиль на основе истории взаимодействий
 */
async function buildUserProfile(userId: string): Promise<UserProfile> {
  const since = new Date(Date.now() - PROFILE_CONFIG.PROFILE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
  
  // Загружаем взаимодействия с промптами
  const interactions = await prisma.promptInteraction.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: PROFILE_CONFIG.MAX_INTERACTIONS_FOR_PROFILE,
    select: {
      promptId: true,
      type: true,
      weight: true,
      createdAt: true,
    },
  })
  
  if (interactions.length === 0) {
    return createEmptyProfile(userId)
  }
  
  // Получаем данные промптов для построения вектора
  const promptIds = [...new Set(interactions.map((i) => i.promptId))]
  const prompts = await prisma.prompt.findMany({
    where: { id: { in: promptIds } },
    select: {
      id: true,
      tags: true,
      category: true,
      model: true,
      lang: true,
    },
  })
  
  const promptMap = new Map(prompts.map((p) => [p.id, p]))
  
  // Вычисляем IDF для всех тегов в системе (для TF-IDF)
  const allPrompts = await prisma.prompt.findMany({
    select: { id: true, tags: true, category: true, model: true, lang: true },
    take: 1000,
  })
  const idf = computeIdfForTags(allPrompts as any)
  
  // Аккумулируем взвешенный профиль
  const profileVector: SparseVector = {}
  const categoryWeights: Record<string, number> = {}
  const tagWeights: Record<string, number> = {}
  const modelWeights: Record<string, number> = {}
  const seenPromptIds = new Set<string>()
  
  const now = Date.now()
  const halfLifeMs = PROFILE_CONFIG.DECAY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000
  
  for (const interaction of interactions) {
    const prompt = promptMap.get(interaction.promptId)
    if (!prompt) continue
    
    // Помечаем как просмотренный
    if (['view', 'open', 'copy'].includes(interaction.type)) {
      seenPromptIds.add(interaction.promptId)
    }
    
    // Decay по времени
    const ageMs = now - interaction.createdAt.getTime()
    const decayFactor = Math.pow(0.5, ageMs / halfLifeMs)
    
    // Вес взаимодействия
    const typeWeight = PROFILE_CONFIG.PROFILE_WEIGHTS[interaction.type] || 0.1
    const totalWeight = interaction.weight * typeWeight * decayFactor
    
    // Строим вектор для этого промпта
    const promptVector = buildSparseVectorTfidf(
      {
        tags: parseTags(prompt.tags),
        category: prompt.category,
        model: prompt.model,
        lang: prompt.lang,
      },
      idf
    )
    
    // Добавляем к профилю с весом
    for (const [key, value] of Object.entries(promptVector)) {
      profileVector[key] = (profileVector[key] || 0) + value * totalWeight
    }
    
    // Аккумулируем категории/теги/модели
    categoryWeights[prompt.category] = (categoryWeights[prompt.category] || 0) + totalWeight
    modelWeights[prompt.model] = (modelWeights[prompt.model] || 0) + totalWeight
    
    for (const tag of parseTags(prompt.tags)) {
      tagWeights[tag.toLowerCase()] = (tagWeights[tag.toLowerCase()] || 0) + totalWeight
    }
  }
  
  // L2 нормализуем профиль
  const norm = Math.sqrt(Object.values(profileVector).reduce((s, v) => s + v * v, 0)) || 1
  for (const k of Object.keys(profileVector)) {
    profileVector[k] = profileVector[k] / norm
  }
  
  // Топ категории/теги/модели
  const topCategories = Object.entries(categoryWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k)
  
  const topTags = Object.entries(tagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k)
  
  const topModels = Object.entries(modelWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)
  
  const isPersonalized = interactions.length >= PROFILE_CONFIG.MIN_INTERACTIONS_FOR_PERSONALIZATION
  
  return {
    userId,
    vector: profileVector,
    interactionCount: interactions.length,
    topCategories,
    topTags,
    topModels,
    seenPromptIds,
    isPersonalized,
    lastUpdated: new Date(),
  }
}

/**
 * Создать пустой профиль для нового пользователя
 */
function createEmptyProfile(userId: string): UserProfile {
  return {
    userId,
    vector: {},
    interactionCount: 0,
    topCategories: [],
    topTags: [],
    topModels: [],
    seenPromptIds: new Set(),
    isPersonalized: false,
    lastUpdated: new Date(),
  }
}

/**
 * Инвалидировать кэш профиля (вызывать после нового взаимодействия)
 */
export async function invalidateUserProfileCache(userId: string): Promise<void> {
  const redis = await getRedis()
  await redis.del(`user:profile:${userId}`)
  logger.debug({ userId }, 'User profile cache invalidated')
}

/**
 * Вычислить персонализированный score для промпта
 */
export function computePersonalizedScore(
  promptVector: SparseVector,
  userProfile: UserProfile,
  promptId: string
): {
  similarity: number
  seenPenalty: number
  finalScore: number
} {
  // Если профиль не персонализирован, возвращаем нейтральный score
  if (!userProfile.isPersonalized || Object.keys(userProfile.vector).length === 0) {
    return {
      similarity: 0.5, // нейтральный
      seenPenalty: 1,
      finalScore: 0.5,
    }
  }
  
  // Cosine similarity между профилем и промптом
  const similarity = cosineSimilarity(userProfile.vector, promptVector)
  
  // Штраф за уже просмотренные
  const seenPenalty = userProfile.seenPromptIds.has(promptId) 
    ? PROFILE_CONFIG.SEEN_PENALTY 
    : 1.0
  
  const finalScore = similarity * seenPenalty
  
  return {
    similarity,
    seenPenalty,
    finalScore,
  }
}

/**
 * Diversity scoring - штраф если слишком много похожих промптов подряд
 */
export function applyDiversityPenalty(
  rankedPrompts: Array<{ id: string; score: number; vector: SparseVector }>,
  topK: number = 12
): Array<{ id: string; score: number; diversityPenalty: number }> {
  const result: Array<{ id: string; score: number; diversityPenalty: number }> = []
  const selectedVectors: SparseVector[] = []
  
  // Greedy selection с diversity penalty
  const remaining = [...rankedPrompts].sort((a, b) => b.score - a.score)
  
  while (result.length < topK && remaining.length > 0) {
    let bestIdx = 0
    let bestScore = -Infinity
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      
      // Вычисляем максимальное сходство с уже выбранными
      let maxSimilarity = 0
      for (const selected of selectedVectors) {
        const sim = cosineSimilarity(candidate.vector, selected)
        maxSimilarity = Math.max(maxSimilarity, sim)
      }
      
      // Diversity penalty: чем больше похоже на уже выбранные, тем больше штраф
      const diversityPenalty = selectedVectors.length === 0 ? 1 : (1 - maxSimilarity * PROFILE_CONFIG.DIVERSITY_BONUS)
      const adjustedScore = candidate.score * diversityPenalty
      
      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        bestIdx = i
      }
    }
    
    const selected = remaining[bestIdx]
    const diversityPenalty = selectedVectors.length === 0 ? 1 : bestScore / selected.score
    
    result.push({
      id: selected.id,
      score: bestScore,
      diversityPenalty,
    })
    selectedVectors.push(selected.vector)
    remaining.splice(bestIdx, 1)
  }
  
  return result
}

/**
 * Обновить UserPreference на основе профиля (для явных предпочтений)
 */
export async function syncProfileToPreferences(userId: string): Promise<void> {
  const profile = await getUserProfile(userId)
  
  if (!profile.isPersonalized) return
  
  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      categories: profile.topCategories,
      tags: profile.topTags,
      models: profile.topModels,
      languages: [],
    },
    update: {
      categories: profile.topCategories,
      tags: profile.topTags,
      models: profile.topModels,
    },
  })
  
  logger.debug({ userId, topCategories: profile.topCategories }, 'Synced profile to preferences')
}


