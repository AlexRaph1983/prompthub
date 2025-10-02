/**
 * Система метрик для поисковых запросов
 */

import { prisma } from '@/lib/prisma'

export interface SearchMetrics {
  countSaved: number
  countRejected: number
  rejectionReasons: Record<string, number>
  lastUpdated: Date
}

export interface RejectionStats {
  reason: string
  count: number
  percentage: number
  description: string
}

/**
 * Обновление метрик при сохранении запроса
 */
export async function incrementSavedCount(): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO SearchMetrics (id, count_saved, count_rejected, rejection_reasons, last_updated)
      VALUES (
        'main',
        COALESCE((SELECT count_saved FROM SearchMetrics WHERE id = 'main'), 0) + 1,
        COALESCE((SELECT count_rejected FROM SearchMetrics WHERE id = 'main'), 0),
        COALESCE((SELECT rejection_reasons FROM SearchMetrics WHERE id = 'main'), '{}'),
        datetime('now')
      )
    `
  } catch (error) {
    console.error('Error updating saved count:', error)
  }
}

/**
 * Обновление метрик при отклонении запроса
 */
export async function incrementRejectedCount(reason: string): Promise<void> {
  try {
    // Получаем текущие метрики
    const current = await prisma.$queryRaw<Array<{
      count_rejected: number
      rejection_reasons: string
    }>>`
      SELECT count_rejected, rejection_reasons 
      FROM SearchMetrics 
      WHERE id = 'main'
    `

    let rejectionReasons: Record<string, number> = {}
    let countRejected = 0

    if (current.length > 0) {
      countRejected = current[0].count_rejected || 0
      try {
        rejectionReasons = JSON.parse(current[0].rejection_reasons || '{}')
      } catch {
        rejectionReasons = {}
      }
    }

    // Увеличиваем счетчик для конкретной причины
    rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1
    countRejected++

    await prisma.$executeRaw`
      INSERT OR REPLACE INTO SearchMetrics (id, count_saved, count_rejected, rejection_reasons, last_updated)
      VALUES (
        'main',
        COALESCE((SELECT count_saved FROM SearchMetrics WHERE id = 'main'), 0),
        ${countRejected},
        ${JSON.stringify(rejectionReasons)},
        datetime('now')
      )
    `
  } catch (error) {
    console.error('Error updating rejected count:', error)
  }
}

/**
 * Получение текущих метрик
 */
export async function getSearchMetrics(): Promise<SearchMetrics> {
  try {
    const result = await prisma.$queryRaw<Array<{
      count_saved: number
      count_rejected: number
      rejection_reasons: string
      last_updated: string
    }>>`
      SELECT count_saved, count_rejected, rejection_reasons, last_updated
      FROM SearchMetrics 
      WHERE id = 'main'
    `

    if (result.length === 0) {
      return {
        countSaved: 0,
        countRejected: 0,
        rejectionReasons: {},
        lastUpdated: new Date()
      }
    }

    const data = result[0]
    let rejectionReasons: Record<string, number> = {}

    try {
      rejectionReasons = JSON.parse(data.rejection_reasons || '{}')
    } catch {
      rejectionReasons = {}
    }

    return {
      countSaved: data.count_saved || 0,
      countRejected: data.count_rejected || 0,
      rejectionReasons,
      lastUpdated: new Date(data.last_updated)
    }
  } catch (error) {
    console.error('Error getting search metrics:', error)
    return {
      countSaved: 0,
      countRejected: 0,
      rejectionReasons: {},
      lastUpdated: new Date()
    }
  }
}

/**
 * Получение статистики отклонений
 */
export async function getRejectionStats(): Promise<RejectionStats[]> {
  try {
    const metrics = await getSearchMetrics()
    const total = metrics.countRejected

    if (total === 0) {
      return []
    }

    return Object.entries(metrics.rejectionReasons)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / total) * 100),
        description: getRejectionReasonDescription(reason)
      }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error getting rejection stats:', error)
    return []
  }
}

/**
 * Сброс метрик (для тестирования)
 */
export async function resetSearchMetrics(): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM SearchMetrics WHERE id = 'main'
    `
  } catch (error) {
    console.error('Error resetting search metrics:', error)
  }
}

/**
 * Получение человекочитаемого описания причины отклонения
 */
function getRejectionReasonDescription(reason: string): string {
  const reasons: Record<string, string> = {
    'MISSING_QUERY': 'Отсутствует поисковый запрос',
    'QUERY_NOT_FINISHED': 'Запрос не завершен (отсутствует флаг finished)',
    'TOO_SHORT': 'Слишком короткий запрос (менее 3 символов)',
    'TOO_LONG': 'Слишком длинный запрос (более 200 символов)',
    'INSUFFICIENT_LETTERS': 'Недостаточно букв (менее 40%)',
    'TOO_MANY_CONSECUTIVE_CHARS': 'Слишком много одинаковых символов подряд (более 3)',
    'ONLY_NUMBERS': 'Запрос состоит только из цифр',
    'ONLY_SPECIAL_CHARS': 'Запрос состоит только из спецсимволов',
    'EMPTY_AFTER_NORMALIZATION': 'Пустой запрос после нормализации'
  }
  
  return reasons[reason] || 'Неизвестная причина'
}
