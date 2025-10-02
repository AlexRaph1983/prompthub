/**
 * Продвинутая система валидации поисковых запросов
 */

export interface ValidationResult {
  valid: boolean
  reason?: string
  normalizedQuery?: string
  metrics?: {
    length: number
    percentLetters: number
    maxConsecutiveChars: number
    hasOnlyNumbers: boolean
    hasOnlySpecialChars: boolean
  }
}

export interface SearchMetrics {
  countSaved: number
  countRejected: number
  rejectionReasons: Record<string, number>
  lastUpdated: Date
}

/**
 * Нормализация Unicode с NFKC
 */
export function normalizeUnicode(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  // NFKC нормализация для Unicode
  let normalized = query.normalize('NFKC')
  
  // Trim и приведение к нижнему регистру
  normalized = normalized.trim().toLowerCase()
  
  // Удаление множественных пробелов
  normalized = normalized.replace(/\s+/g, ' ')
  
  return normalized
}

/**
 * Подсчет процента букв (исключая пробелы)
 */
export function calculateLetterPercentage(query: string): number {
  if (!query) return 0
  
  const withoutSpaces = query.replace(/\s/g, '')
  if (withoutSpaces.length === 0) return 0
  
  const letterCount = withoutSpaces.replace(/[^a-zа-яё]/gi, '').length
  return Math.round((letterCount / withoutSpaces.length) * 100)
}

/**
 * Подсчет максимального количества одинаковых символов подряд
 */
export function getMaxConsecutiveChars(query: string): number {
  if (!query) return 0
  
  let maxConsecutive = 1
  let currentConsecutive = 1
  
  for (let i = 1; i < query.length; i++) {
    if (query[i] === query[i - 1]) {
      currentConsecutive++
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      currentConsecutive = 1
    }
  }
  
  return Math.max(maxConsecutive, currentConsecutive)
}

/**
 * Проверка на только цифры
 */
export function hasOnlyNumbers(query: string): boolean {
  if (!query) return false
  const withoutSpaces = query.replace(/\s/g, '')
  return /^\d+$/.test(withoutSpaces)
}

/**
 * Проверка на только спецсимволы
 */
export function hasOnlySpecialChars(query: string): boolean {
  if (!query) return false
  const withoutSpaces = query.replace(/\s/g, '')
  return /^[^a-zа-яё0-9]+$/i.test(withoutSpaces)
}

/**
 * Основная функция валидации поискового запроса
 */
export function validateSearchQuery(
  query: string, 
  finished: boolean = false
): ValidationResult {
  // Проверка обязательных параметров
  if (!query || typeof query !== 'string') {
    return {
      valid: false,
      reason: 'MISSING_QUERY'
    }
  }

  if (!finished) {
    return {
      valid: false,
      reason: 'QUERY_NOT_FINISHED'
    }
  }

  // Нормализация
  const normalized = normalizeUnicode(query)
  
  // Проверка длины
  if (normalized.length < 3) {
    return {
      valid: false,
      reason: 'TOO_SHORT',
      normalizedQuery: normalized,
      metrics: {
        length: normalized.length,
        percentLetters: calculateLetterPercentage(normalized),
        maxConsecutiveChars: getMaxConsecutiveChars(normalized),
        hasOnlyNumbers: hasOnlyNumbers(normalized),
        hasOnlySpecialChars: hasOnlySpecialChars(normalized)
      }
    }
  }

  if (normalized.length > 200) {
    return {
      valid: false,
      reason: 'TOO_LONG',
      normalizedQuery: normalized,
      metrics: {
        length: normalized.length,
        percentLetters: calculateLetterPercentage(normalized),
        maxConsecutiveChars: getMaxConsecutiveChars(normalized),
        hasOnlyNumbers: hasOnlyNumbers(normalized),
        hasOnlySpecialChars: hasOnlySpecialChars(normalized)
      }
    }
  }

  // Подсчет метрик
  const percentLetters = calculateLetterPercentage(normalized)
  const maxConsecutiveChars = getMaxConsecutiveChars(normalized)
  const onlyNumbers = hasOnlyNumbers(normalized)
  const onlySpecialChars = hasOnlySpecialChars(normalized)

  const metrics = {
    length: normalized.length,
    percentLetters,
    maxConsecutiveChars,
    hasOnlyNumbers: onlyNumbers,
    hasOnlySpecialChars: onlySpecialChars
  }

  // Проверка процента букв (минимум 40%)
  if (percentLetters < 40) {
    return {
      valid: false,
      reason: 'INSUFFICIENT_LETTERS',
      normalizedQuery: normalized,
      metrics
    }
  }

  // Проверка на повторяющиеся символы (максимум 3 подряд)
  if (maxConsecutiveChars > 3) {
    return {
      valid: false,
      reason: 'TOO_MANY_CONSECUTIVE_CHARS',
      normalizedQuery: normalized,
      metrics
    }
  }

  // Проверка на только цифры
  if (onlyNumbers) {
    return {
      valid: false,
      reason: 'ONLY_NUMBERS',
      normalizedQuery: normalized,
      metrics
    }
  }

  // Проверка на только спецсимволы
  if (onlySpecialChars) {
    return {
      valid: false,
      reason: 'ONLY_SPECIAL_CHARS',
      normalizedQuery: normalized,
      metrics
    }
  }

  // Проверка на пустой запрос после нормализации
  if (normalized.length === 0) {
    return {
      valid: false,
      reason: 'EMPTY_AFTER_NORMALIZATION',
      normalizedQuery: normalized,
      metrics
    }
  }

  return {
    valid: true,
    normalizedQuery: normalized,
    metrics
  }
}

/**
 * Создание хэша запроса для дедупликации
 */
export function createQueryHash(query: string, userId?: string, ipHash?: string): string {
  const crypto = require('crypto')
  const key = `${query}:${userId || ipHash || 'anonymous'}`
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16)
}

/**
 * Получение человекочитаемого описания причины отклонения
 */
export function getRejectionReasonDescription(reason: string): string {
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
