/**
 * Сервис для управления взаимодействиями пользователей с промптами
 * Включает защиту от спама (TTL, threshold) и аудит логи
 */

import { prisma } from '@/lib/prisma'
import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// ============ КОНФИГУРАЦИЯ ============
export const INTERACTION_CONFIG = {
  // TTL окна для rate limiting (секунды)
  RATE_LIMIT_WINDOW_SECONDS: 60,
  
  // Лимиты по типу взаимодействия за окно
  RATE_LIMITS: {
    view: 30,      // 30 views/min per user per prompt
    copy: 10,      // 10 copies/min per user per prompt  
    like: 5,       // 5 likes/min globally per user
    save: 5,       // 5 saves/min globally per user
    open: 60,      // 60 opens/min - клики для перехода
  } as Record<string, number>,

  // Глобальные лимиты на пользователя
  GLOBAL_RATE_LIMITS: {
    interactions_per_minute: 100,
    interactions_per_hour: 1000,
  },
  
  // Минимальный интервал между одинаковыми взаимодействиями (секунды)
  MIN_INTERVAL_SECONDS: {
    view: 5,       // Не чаще 1 view/5sec на тот же prompt
    copy: 2,       // Не чаще 1 copy/2sec на тот же prompt
    like: 1,       // Не чаще 1 like/sec
    save: 1,       // Не чаще 1 save/sec
    open: 1,       // Не чаще 1 open/sec
  } as Record<string, number>,

  // Веса взаимодействий для профиля
  INTERACTION_WEIGHTS: {
    view: 0.1,
    open: 0.2,
    copy: 1.0,
    like: 0.8,
    save: 0.9,
    rate: 0.7,
    comment: 0.6,
  } as Record<string, number>,
  
  // Decay factor для старых взаимодействий (дней)
  DECAY_HALF_LIFE_DAYS: 14,
}

export type InteractionType = 'view' | 'copy' | 'like' | 'save' | 'open' | 'rate' | 'comment'

export interface InteractionInput {
  promptId: string
  type: InteractionType
  userId?: string  // из сессии
  weight?: number
  metadata?: Record<string, any>
}

export interface InteractionResult {
  success: boolean
  reason?: string
  rateLimited?: boolean
  interaction?: {
    id: string
    type: string
    createdAt: Date
  }
}

export interface AuditLogEntry {
  event: string
  userId: string
  promptId?: string
  type?: string
  success: boolean
  reason?: string
  metadata?: Record<string, any>
  timestamp: Date
  requestId?: string
  ip?: string
}

/**
 * Создать стабильный actor ID для анонимных пользователей
 */
export function createAnonymousActorId(ip: string, userAgent: string): string {
  const fp = crypto.createHash('sha256').update(`${ip}|${userAgent}`).digest('hex').slice(0, 32)
  return `anon:${fp}`
}

/**
 * Проверка rate limiting для взаимодействия
 */
export async function checkInteractionRateLimit(
  actorId: string,
  promptId: string,
  type: InteractionType
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const redis = await getRedis()
  const now = Math.floor(Date.now() / 1000)
  
  // 1. Проверка минимального интервала между одинаковыми взаимодействиями
  const minInterval = INTERACTION_CONFIG.MIN_INTERVAL_SECONDS[type] || 1
  const lastInteractionKey = `interaction:last:${actorId}:${promptId}:${type}`
  const lastTs = await redis.get(lastInteractionKey)
  
  if (lastTs) {
    const elapsed = now - parseInt(lastTs, 10)
    if (elapsed < minInterval) {
      return {
        allowed: false,
        reason: 'TOO_FREQUENT',
        retryAfter: minInterval - elapsed,
      }
    }
  }
  
  // 2. Проверка rate limit per user per prompt per type
  const rateLimit = INTERACTION_CONFIG.RATE_LIMITS[type] || 10
  const rateLimitKey = `interaction:rate:${actorId}:${promptId}:${type}:${Math.floor(now / INTERACTION_CONFIG.RATE_LIMIT_WINDOW_SECONDS)}`
  const currentCount = await redis.incr(rateLimitKey)
  
  if (currentCount === 1) {
    await redis.expire(rateLimitKey, INTERACTION_CONFIG.RATE_LIMIT_WINDOW_SECONDS * 2)
  }
  
  if (currentCount > rateLimit) {
    return {
      allowed: false,
      reason: 'RATE_LIMIT_EXCEEDED',
      retryAfter: INTERACTION_CONFIG.RATE_LIMIT_WINDOW_SECONDS,
    }
  }
  
  // 3. Глобальный rate limit на пользователя
  const globalMinuteKey = `interaction:global:${actorId}:minute:${Math.floor(now / 60)}`
  const globalMinuteCount = await redis.incr(globalMinuteKey)
  if (globalMinuteCount === 1) {
    await redis.expire(globalMinuteKey, 120)
  }
  
  if (globalMinuteCount > INTERACTION_CONFIG.GLOBAL_RATE_LIMITS.interactions_per_minute) {
    return {
      allowed: false,
      reason: 'GLOBAL_RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    }
  }
  
  // 4. Обновить timestamp последнего взаимодействия
  await redis.set(lastInteractionKey, now.toString(), 'EX', minInterval * 2)
  
  return { allowed: true }
}

/**
 * Записать взаимодействие с защитой от спама
 */
export async function recordInteraction(
  input: InteractionInput,
  context: {
    ip?: string
    userAgent?: string
    requestId?: string
  }
): Promise<InteractionResult> {
  const { promptId, type, userId, weight, metadata } = input
  const { ip, userAgent, requestId } = context
  
  // Определяем actor ID
  const actorId = userId || createAnonymousActorId(ip || '', userAgent || '')
  
  // Проверка rate limiting
  const rateCheck = await checkInteractionRateLimit(actorId, promptId, type)
  
  if (!rateCheck.allowed) {
    // Логируем заблокированную попытку
    logAudit({
      event: 'interaction.blocked',
      userId: actorId,
      promptId,
      type,
      success: false,
      reason: rateCheck.reason,
      metadata: { retryAfter: rateCheck.retryAfter, ...metadata },
      timestamp: new Date(),
      requestId,
      ip,
    })
    
    return {
      success: false,
      reason: rateCheck.reason,
      rateLimited: true,
    }
  }
  
  try {
    // Записываем в БД
    const interaction = await prisma.promptInteraction.create({
      data: {
        userId: actorId,
        promptId,
        type: type.toLowerCase(),
        weight: weight ?? INTERACTION_CONFIG.INTERACTION_WEIGHTS[type] ?? 1,
      },
    })
    
    // Логируем успешное взаимодействие
    logAudit({
      event: 'interaction.recorded',
      userId: actorId,
      promptId,
      type,
      success: true,
      metadata: { interactionId: interaction.id, ...metadata },
      timestamp: new Date(),
      requestId,
      ip,
    })
    
    return {
      success: true,
      interaction: {
        id: interaction.id,
        type: interaction.type,
        createdAt: interaction.createdAt,
      },
    }
  } catch (error) {
    logger.error({ error, actorId, promptId, type }, 'Failed to record interaction')
    
    logAudit({
      event: 'interaction.error',
      userId: actorId,
      promptId,
      type,
      success: false,
      reason: 'DATABASE_ERROR',
      metadata: { error: String(error), ...metadata },
      timestamp: new Date(),
      requestId,
      ip,
    })
    
    return {
      success: false,
      reason: 'DATABASE_ERROR',
    }
  }
}

/**
 * Получить историю взаимодействий пользователя для построения профиля
 */
export async function getUserInteractionHistory(
  userId: string,
  options: {
    limit?: number
    types?: InteractionType[]
    since?: Date
  } = {}
): Promise<Array<{
  promptId: string
  type: string
  weight: number
  createdAt: Date
  decayedWeight: number
}>> {
  const { limit = 100, types, since } = options
  
  const interactions = await prisma.promptInteraction.findMany({
    where: {
      userId,
      ...(types && { type: { in: types } }),
      ...(since && { createdAt: { gte: since } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      promptId: true,
      type: true,
      weight: true,
      createdAt: true,
    },
  })
  
  const now = Date.now()
  const halfLifeMs = INTERACTION_CONFIG.DECAY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000
  
  return interactions.map((i) => {
    const ageMs = now - i.createdAt.getTime()
    const decayFactor = Math.pow(0.5, ageMs / halfLifeMs)
    return {
      ...i,
      decayedWeight: i.weight * decayFactor,
    }
  })
}

/**
 * Получить ID промптов, которые пользователь уже видел
 */
export async function getUserSeenPromptIds(
  userId: string,
  options: {
    limit?: number
    since?: Date
  } = {}
): Promise<Set<string>> {
  const { limit = 500, since } = options
  
  const interactions = await prisma.promptInteraction.findMany({
    where: {
      userId,
      type: { in: ['view', 'open', 'copy'] },
      ...(since && { createdAt: { gte: since } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { promptId: true },
    distinct: ['promptId'],
  })
  
  return new Set(interactions.map((i) => i.promptId))
}

/**
 * Проверка дубликатов - не записывать одинаковые взаимодействия подряд
 */
export async function checkDuplicateInteraction(
  userId: string,
  promptId: string,
  type: InteractionType,
  windowSeconds: number = 60
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000)
  
  const existing = await prisma.promptInteraction.findFirst({
    where: {
      userId,
      promptId,
      type,
      createdAt: { gte: since },
    },
    select: { id: true },
  })
  
  return !!existing
}

/**
 * Структурированный аудит лог
 */
export function logAudit(entry: AuditLogEntry): void {
  const { event, userId, promptId, type, success, reason, metadata, timestamp, requestId, ip } = entry
  
  logger.info({
    audit: true,
    event,
    actor: userId,
    resource: promptId,
    action: type,
    outcome: success ? 'success' : 'failure',
    reason,
    metadata,
    requestId,
    // ip редактируется в конфиге logger
    timestamp: timestamp.toISOString(),
  }, `[AUDIT] ${event}`)
}

/**
 * Статистика взаимодействий для мониторинга
 */
export async function getInteractionStats(windowHours: number = 24): Promise<{
  total: number
  byType: Record<string, number>
  uniqueUsers: number
  uniquePrompts: number
}> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)
  
  const [total, byType, users, prompts] = await Promise.all([
    prisma.promptInteraction.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.promptInteraction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.promptInteraction.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.promptInteraction.findMany({
      where: { createdAt: { gte: since } },
      select: { promptId: true },
      distinct: ['promptId'],
    }),
  ])
  
  return {
    total,
    byType: Object.fromEntries(byType.map((b) => [b.type, b._count])),
    uniqueUsers: users.length,
    uniquePrompts: prompts.length,
  }
}


