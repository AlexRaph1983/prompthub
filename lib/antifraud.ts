import crypto from 'crypto'
import { prisma } from './prisma'
import { getRedis } from './redis'
import { logger } from './logger'

export interface AntifraudResult {
  allowed: boolean
  reason?: string
  confidence: number // 0-1, где 1 = максимальная уверенность в боте
  metadata?: Record<string, any>
}

export interface AntifraudContext {
  ip?: string
  userAgent?: string
  fingerprint?: string
  userId?: string
  promptId: string
  referer?: string
  acceptLanguage?: string
  timestamp: number
}

/**
 * Улучшенная система антифрода с множественными проверками
 */
export class AntifraudEngine {
  private static readonly BOT_UA_PATTERNS = [
    // Headless браузеры
    'headlesschrome', 'headlessfirefox', 'phantomjs', 'selenium',
    // Боты и краулеры
    'bot', 'crawler', 'spider', 'scraper', 'crawling',
    // HTTP клиенты
    'curl', 'wget', 'python-requests', 'java-http', 'go-http',
    'httpclient', 'okhttp', 'apache-httpclient',
    // Автоматизированные инструменты
    'postman', 'insomnia', 'paw', 'restclient',
    // Подозрительные паттерны
    'automated', 'test', 'monitor', 'checker'
  ]

  private static readonly SUSPICIOUS_REFERERS = [
    '', // Пустой referer
    'data:', // Data URL
    'javascript:', // JavaScript URL
    'about:blank' // Blank page
  ]

  private static readonly RATE_LIMIT_WINDOWS = {
    // Окна для разных типов проверок
    IP_PER_MINUTE: 60,
    IP_PER_HOUR: 3600,
    USER_PER_HOUR: 3600,
    FINGERPRINT_PER_HOUR: 3600,
    GLOBAL_PER_MINUTE: 60
  }

  /**
   * Основная функция проверки антифрода
   */
  static async check(context: AntifraudContext): Promise<AntifraudResult> {
    const checks = await Promise.allSettled([
      this.checkUserAgent(context.userAgent),
      this.checkRateLimits(context),
      this.checkSuspiciousPatterns(context),
      this.checkGeolocation(context.ip),
      this.checkFingerprint(context.fingerprint),
      this.checkReferer(context.referer),
      this.checkAcceptLanguage(context.acceptLanguage)
    ])

    const results = checks
      .filter((result): result is PromiseFulfilledResult<AntifraudResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)

    // Агрегируем результаты
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0)
    const avgConfidence = totalConfidence / results.length
    const blockedChecks = results.filter(r => !r.allowed)

    if (blockedChecks.length > 0) {
      const primaryReason = blockedChecks[0].reason
      const metadata = Object.assign({}, ...results.map(r => r.metadata))
      
      logger.warn({
        context: {
          ip: context.ip,
          userAgent: context.userAgent,
          promptId: context.promptId,
          userId: context.userId
        },
        antifraud: {
          reason: primaryReason,
          confidence: avgConfidence,
          blockedChecks: blockedChecks.length,
          totalChecks: results.length
        }
      }, 'Antifraud check failed')

      return {
        allowed: false,
        reason: primaryReason,
        confidence: avgConfidence,
        metadata
      }
    }

    return {
      allowed: true,
      confidence: avgConfidence,
      metadata: Object.assign({}, ...results.map(r => r.metadata))
    }
  }

  /**
   * Проверка User-Agent на подозрительные паттерны
   */
  private static async checkUserAgent(userAgent?: string): Promise<AntifraudResult> {
    if (!userAgent) {
      return {
        allowed: false,
        reason: 'MISSING_USER_AGENT',
        confidence: 0.8,
        metadata: { check: 'user_agent', issue: 'missing' }
      }
    }

    const ua = userAgent.toLowerCase()
    const isBot = this.BOT_UA_PATTERNS.some(pattern => ua.includes(pattern))
    
    if (isBot) {
      return {
        allowed: false,
        reason: 'BOT_USER_AGENT',
        confidence: 0.9,
        metadata: { 
          check: 'user_agent', 
          issue: 'bot_pattern',
          userAgent: userAgent.slice(0, 100) // Логируем только первые 100 символов
        }
      }
    }

    // Проверяем на слишком короткий или подозрительный UA
    if (userAgent.length < 10 || userAgent.length > 500) {
      return {
        allowed: false,
        reason: 'SUSPICIOUS_USER_AGENT_LENGTH',
        confidence: 0.6,
        metadata: { 
          check: 'user_agent', 
          issue: 'length',
          length: userAgent.length
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'user_agent', status: 'clean' }
    }
  }

  /**
   * Проверка rate limits на разных уровнях
   */
  private static async checkRateLimits(context: AntifraudContext): Promise<AntifraudResult> {
    const redis = await getRedis()
    const now = Math.floor(Date.now() / 1000)
    
    // Проверяем IP rate limits
    if (context.ip) {
      const ipHash = this.hashIp(context.ip)
      
      // Проверяем количество запросов с IP за последнюю минуту
      const ipMinuteKey = `antifraud:ip:${ipHash}:minute:${Math.floor(now / 60)}`
      const ipMinuteCount = await redis.incr(ipMinuteKey)
      await redis.expire(ipMinuteKey, 120) // TTL 2 минуты
      
      if (ipMinuteCount > 30) { // Более 30 запросов в минуту
        return {
          allowed: false,
          reason: 'IP_RATE_LIMIT_EXCEEDED',
          confidence: 0.8,
          metadata: { 
            check: 'rate_limit', 
            type: 'ip_minute',
            count: ipMinuteCount,
            limit: 30
          }
        }
      }

      // Проверяем количество запросов с IP за последний час
      const ipHourKey = `antifraud:ip:${ipHash}:hour:${Math.floor(now / 3600)}`
      const ipHourCount = await redis.incr(ipHourKey)
      await redis.expire(ipHourKey, 7200) // TTL 2 часа
      
      if (ipHourCount > 200) { // Более 200 запросов в час
        return {
          allowed: false,
          reason: 'IP_HOURLY_RATE_LIMIT_EXCEEDED',
          confidence: 0.7,
          metadata: { 
            check: 'rate_limit', 
            type: 'ip_hour',
            count: ipHourCount,
            limit: 200
          }
        }
      }
    }

    // Проверяем user rate limits (если авторизован)
    if (context.userId) {
      const userHourKey = `antifraud:user:${context.userId}:hour:${Math.floor(now / 3600)}`
      const userHourCount = await redis.incr(userHourKey)
      await redis.expire(userHourKey, 7200)
      
      if (userHourCount > 100) { // Более 100 запросов в час от пользователя
        return {
          allowed: false,
          reason: 'USER_RATE_LIMIT_EXCEEDED',
          confidence: 0.6,
          metadata: { 
            check: 'rate_limit', 
            type: 'user_hour',
            count: userHourCount,
            limit: 100
          }
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'rate_limit', status: 'within_limits' }
    }
  }

  /**
   * Проверка подозрительных паттернов поведения
   */
  private static async checkSuspiciousPatterns(context: AntifraudContext): Promise<AntifraudResult> {
    const redis = await getRedis()
    
    // Проверяем на последовательные запросы с одинаковыми параметрами
    if (context.ip && context.userAgent) {
      const patternKey = `antifraud:pattern:${this.hashIp(context.ip)}:${this.hashUa(context.userAgent)}`
      const patternCount = await redis.incr(patternKey)
      await redis.expire(patternKey, 300) // TTL 5 минут
      
      if (patternCount > 10) { // Более 10 одинаковых запросов за 5 минут
        return {
          allowed: false,
          reason: 'SUSPICIOUS_PATTERN_DETECTED',
          confidence: 0.7,
          metadata: { 
            check: 'suspicious_pattern', 
            count: patternCount,
            limit: 10
          }
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'suspicious_pattern', status: 'clean' }
    }
  }

  /**
   * Проверка геолокации (базовая проверка IP)
   */
  private static async checkGeolocation(ip?: string): Promise<AntifraudResult> {
    if (!ip) {
      return {
        allowed: true,
        confidence: 0.1,
        metadata: { check: 'geolocation', status: 'no_ip' }
      }
    }

    // Проверяем на известные VPN/Proxy IP (упрощённая проверка)
    const isPrivateIp = this.isPrivateIp(ip)
    if (isPrivateIp) {
      return {
        allowed: false,
        reason: 'PRIVATE_IP_ADDRESS',
        confidence: 0.5,
        metadata: { 
          check: 'geolocation', 
          issue: 'private_ip',
          ip: ip
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'geolocation', status: 'public_ip' }
    }
  }

  /**
   * Проверка fingerprint на подозрительность
   */
  private static async checkFingerprint(fingerprint?: string): Promise<AntifraudResult> {
    if (!fingerprint) {
      return {
        allowed: true,
        confidence: 0.1,
        metadata: { check: 'fingerprint', status: 'no_fingerprint' }
      }
    }

    // Проверяем на слишком простые или подозрительные fingerprint
    if (fingerprint.length < 10 || fingerprint.length > 200) {
      return {
        allowed: false,
        reason: 'SUSPICIOUS_FINGERPRINT',
        confidence: 0.6,
        metadata: { 
          check: 'fingerprint', 
          issue: 'length',
          length: fingerprint.length
        }
      }
    }

    // Проверяем на повторяющиеся символы (возможный бот)
    const uniqueChars = new Set(fingerprint).size
    if (uniqueChars < 5) {
      return {
        allowed: false,
        reason: 'SIMPLE_FINGERPRINT',
        confidence: 0.7,
        metadata: { 
          check: 'fingerprint', 
          issue: 'low_entropy',
          uniqueChars
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'fingerprint', status: 'valid' }
    }
  }

  /**
   * Проверка referer на подозрительность
   */
  private static async checkReferer(referer?: string): Promise<AntifraudResult> {
    if (!referer) {
      return {
        allowed: true,
        confidence: 0.1,
        metadata: { check: 'referer', status: 'no_referer' }
      }
    }

    if (this.SUSPICIOUS_REFERERS.includes(referer)) {
      return {
        allowed: false,
        reason: 'SUSPICIOUS_REFERER',
        confidence: 0.6,
        metadata: { 
          check: 'referer', 
          issue: 'suspicious',
          referer: referer
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'referer', status: 'valid' }
    }
  }

  /**
   * Проверка Accept-Language заголовка
   */
  private static async checkAcceptLanguage(acceptLanguage?: string): Promise<AntifraudResult> {
    if (!acceptLanguage) {
      return {
        allowed: false,
        reason: 'MISSING_ACCEPT_LANGUAGE',
        confidence: 0.7,
        metadata: { 
          check: 'accept_language', 
          issue: 'missing'
        }
      }
    }

    // Проверяем на слишком простой или подозрительный Accept-Language
    if (acceptLanguage.length < 2 || acceptLanguage.length > 100) {
      return {
        allowed: false,
        reason: 'SUSPICIOUS_ACCEPT_LANGUAGE',
        confidence: 0.5,
        metadata: { 
          check: 'accept_language', 
          issue: 'length',
          length: acceptLanguage.length
        }
      }
    }

    return {
      allowed: true,
      confidence: 0.1,
      metadata: { check: 'accept_language', status: 'valid' }
    }
  }

  /**
   * Утилиты для хеширования
   */
  private static hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
  }

  private static hashUa(userAgent: string): string {
    return crypto.createHash('sha256').update(userAgent).digest('hex').slice(0, 16)
  }

  private static isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4) return false
    
    // 10.0.0.0/8
    if (parts[0] === 10) return true
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true
    // 127.0.0.0/8 (localhost)
    if (parts[0] === 127) return true
    
    return false
  }
}

/**
 * Создание алерта о подозрительной активности
 */
export async function createAntifraudAlert(
  type: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  message: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.viewMonitoringAlert.create({
      data: {
        type,
        severity,
        message,
        metadata: metadata || {}
      }
    })
    
    logger.warn({
      alert: { type, severity, message, metadata }
    }, 'Antifraud alert created')
  } catch (error) {
    logger.error({ error, type, severity, message }, 'Failed to create antifraud alert')
  }
}

/**
 * Проверка на spike в отклонённых просмотрах
 */
export async function checkRejectionSpike(): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const now = new Date()
    
    const [totalViews, rejectedViews] = await Promise.all([
      prisma.promptViewEvent.count({
        where: { createdAt: { gte: oneHourAgo, lte: now } }
      }),
      prisma.promptViewEvent.count({
        where: { 
          createdAt: { gte: oneHourAgo, lte: now },
          isCounted: false
        }
      })
    ])
    
    if (totalViews > 0) {
      const rejectionRate = rejectedViews / totalViews
      
      // Если отклонений больше 30% - создаём алерт
      if (rejectionRate > 0.3) {
        await createAntifraudAlert(
          'HIGH_REJECTION_RATE',
          rejectionRate > 0.5 ? 'CRITICAL' : 'HIGH',
          `High rejection rate detected: ${(rejectionRate * 100).toFixed(1)}%`,
          {
            totalViews,
            rejectedViews,
            rejectionRate,
            timeWindow: '1h'
          }
        )
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to check rejection spike')
  }
}





