import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { onViewsUpdated } from '@/lib/viewsIntegration'
import { AntifraudEngine, AntifraudContext } from '@/lib/antifraud'

const requestSchema = z.object({
  cardId: z.string().min(1),
  viewToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()
  
  try {
    console.log(`[TRACK-VIEW:${requestId}] API called`, {
      referer: req.headers.get('referer'),
      userAgent: req.headers.get('user-agent')?.slice(0, 50),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      fingerprint: req.headers.get('x-fingerprint')?.slice(0, 8)
    })
    
    const json = await req.json().catch(() => null)
    if (!json) {
      console.log(`[TRACK-VIEW:${requestId}] Invalid payload - no JSON`)
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const parsed = requestSchema.safeParse(json)
    if (!parsed.success) {
      console.log(`[TRACK-VIEW:${requestId}] Invalid payload - schema validation failed`, parsed.error)
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const { cardId, viewToken } = parsed.data
    console.log(`[TRACK-VIEW:${requestId}] Processing`, {
      cardId,
      tokenPrefix: viewToken.slice(0, 16)
    })

    // Проверяем, что промпт существует
    const prompt = await prisma.prompt.findUnique({ 
      where: { id: cardId }, 
      select: { id: true, views: true, authorId: true } 
    })

    if (!prompt) {
      console.log(`[TRACK-VIEW:${requestId}] Prompt not found:`, cardId)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Валидация токена с использованием Redis
    const { getRedis } = await import('@/lib/redis')
    const redis = await getRedis()
    
    // Проверяем, не был ли токен уже использован
    const tokenUsedKey = `token:used:${viewToken}`
    const tokenAlreadyUsed = await redis.get(tokenUsedKey)
    
    if (tokenAlreadyUsed) {
      console.log(`[TRACK-VIEW:${requestId}] Token already used`, { tokenPrefix: viewToken.slice(0, 16) })
      return NextResponse.json({ 
        error: 'INVALID_OR_REUSED_TOKEN',
        reason: 'TOKEN_REUSED',
        counted: false 
      }, { status: 400 })
    }

    // Проверка Referer - должен быть со страницы промпта
    const referer = req.headers.get('referer')
    if (referer) {
      const refererUrl = new URL(referer)
      const isValidReferer = refererUrl.pathname.includes(`/prompt/${cardId}`) ||
                             refererUrl.pathname.includes(`/${cardId}`)
      
      if (!isValidReferer) {
        console.log(`[TRACK-VIEW:${requestId}] Invalid referer`, { 
          referer: refererUrl.pathname,
          expected: `/prompt/${cardId}`
        })
        return NextResponse.json({ 
          error: 'INVALID_REFERER_FOR_VIEW',
          reason: 'INVALID_REFERER',
          counted: false 
        }, { status: 400 })
      }
    }

    // Получаем fingerprint из заголовка
    const fingerprint = req.headers.get('x-fingerprint')
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    const userAgent = req.headers.get('user-agent')
    
    // Создаем ключ дедупликации
    const { computeIpHash, computeUaHash, normalizeFingerprint } = await import('@/lib/promptViewService')
    const fpHash = normalizeFingerprint(fingerprint)
    const ipHash = computeIpHash(ip || undefined)
    const uaHash = computeUaHash(userAgent || undefined)
    
    const dedupAnchor = fpHash || ipHash || uaHash || 'unknown'
    const dedupWindowSeconds = 30
    const dedupKey = `view:dedupe:${cardId}:${dedupAnchor}:${Math.floor(Date.now() / (dedupWindowSeconds * 1000))}`
    
    // Проверяем дедупликацию
    const dedupResult = await redis.set(dedupKey, '1', 'NX', 'EX', dedupWindowSeconds)
    
    if (dedupResult !== 'OK') {
      console.log(`[TRACK-VIEW:${requestId}] Dedup window active`, { 
        dedupKey: dedupKey.slice(0, 50),
        window: `${dedupWindowSeconds}s`
      })
      return NextResponse.json({ 
        counted: false,
        reason: 'DEDUP_WINDOW',
        views: prompt.views 
      }, { status: 200 })
    }

    // Проверка антифрода
    const antifraudContext: AntifraudContext = {
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      fingerprint: fingerprint || undefined,
      userId: req.headers.get('x-user-id') || undefined,
      promptId: cardId,
      referer: referer || undefined,
      acceptLanguage: req.headers.get('accept-language') || undefined,
      timestamp: Date.now()
    }

    const antifraudResult = await AntifraudEngine.check(antifraudContext)
    
    if (!antifraudResult.allowed) {
      console.log(`[TRACK-VIEW:${requestId}] Antifraud check failed`, {
        reason: antifraudResult.reason,
        confidence: antifraudResult.confidence
      })
      
      // Записываем событие как отклоненное
      const { recordPromptViewEvent } = await import('@/lib/promptViewService')
      await recordPromptViewEvent({
        promptId: cardId,
        userId: antifraudContext.userId || null,
        ipHash: ipHash || null,
        uaHash: uaHash || null,
        fpHash: fpHash || null,
        viewTokenId: viewToken,
        isCounted: false,
        reason: antifraudResult.reason
      })
      
      return NextResponse.json({ 
        error: 'ANTIFRAUD_BLOCKED', 
        reason: antifraudResult.reason,
        confidence: antifraudResult.confidence,
        counted: false
      }, { status: 403 })
    }

    console.log(`[TRACK-VIEW:${requestId}] Incrementing views...`)
    
    // Помечаем токен как использованный (1 час TTL)
    await redis.set(tokenUsedKey, '1', 'EX', 3600)
    
    // Инкрементируем просмотры
    const updated = await prisma.prompt.update({
      where: { id: cardId },
      data: { views: { increment: 1 } },
      select: { views: true }
    })

    // Записываем событие как засчитанное
    const { recordPromptViewEvent } = await import('@/lib/promptViewService')
    await recordPromptViewEvent({
      promptId: cardId,
      userId: antifraudContext.userId || null,
      ipHash: ipHash || null,
      uaHash: uaHash || null,
      fpHash: fpHash || null,
      viewTokenId: viewToken,
      isCounted: true,
      reason: null
    })

    console.log(`[TRACK-VIEW:${requestId}] Views incremented`, {
      newCount: updated.views,
      elapsed: `${Date.now() - startTime}ms`
    })

    // Интеграция с системой рейтингов и рекомендаций
    Promise.resolve(onViewsUpdated(cardId, updated.views)).catch(error => {
      console.error(`[TRACK-VIEW:${requestId}] Views integration failed:`, error)
    })

    return NextResponse.json({
      counted: true,
      views: updated.views,
    })
  } catch (error) {
    console.error(`[TRACK-VIEW:${requestId}] API error:`, error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}