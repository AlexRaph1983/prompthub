/**
 * Утилиты для нормализации и валидации поисковых запросов
 */

// Стоп-слова для фильтрации
const STOP_WORDS = new Set([
  'и', 'в', 'на', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'у', 'о', 'об', 'за', 'при', 'со', 'во', 'не', 'ни', 'или', 'но', 'а', 'да', 'нет', 'да', 'нет',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among'
])

// Regex для валидации: только буквы, цифры, кириллица, пробелы и дефисы
const VALID_QUERY_REGEX = /^[A-Za-z0-9\u0400-\u04FF\s\-]+$/

/**
 * Нормализует поисковый запрос
 */
export function normalizeQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  // Trim и приведение к нижнему регистру
  let normalized = query.trim().toLowerCase()
  
  // NFKC нормализация для Unicode
  normalized = normalized.normalize('NFKC')
  
  // Удаление повторяющихся пробелов
  normalized = normalized.replace(/\s+/g, ' ')
  
  // Удаление повторяющихся подряд символов (больше 2)
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1')
  
  return normalized
}

/**
 * Фильтрует стоп-слова из запроса
 */
export function filterStopWords(query: string): string {
  const words = query.split(/\s+/)
  const filteredWords = words.filter(word => 
    word.length > 0 && !STOP_WORDS.has(word)
  )
  return filteredWords.join(' ')
}

/**
 * Проверяет валидность поискового запроса
 */
export function isValidQuery(query: string): { valid: boolean; reason?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, reason: 'Query is required' }
  }

  const normalized = normalizeQuery(query)
  
  // Минимальная длина
  if (normalized.length < 3) {
    return { valid: false, reason: 'Query too short (minimum 3 characters)' }
  }

  // Максимальная длина
  if (normalized.length > 100) {
    return { valid: false, reason: 'Query too long (maximum 100 characters)' }
  }

  // Проверка на валидные символы
  if (!VALID_QUERY_REGEX.test(normalized)) {
    return { valid: false, reason: 'Query contains invalid characters' }
  }

  // Проверка на пустой запрос после фильтрации
  const filtered = filterStopWords(normalized)
  if (filtered.length < 3) {
    return { valid: false, reason: 'Query contains only stop words' }
  }

  return { valid: true }
}

/**
 * Создает хэш запроса для дедупликации
 */
export function createQueryHash(query: string, userId?: string, ipHash?: string): string {
  const normalized = normalizeQuery(query)
  const filtered = filterStopWords(normalized)
  const key = `${filtered}:${userId || ipHash || 'anonymous'}`
  
  // Используем crypto для создания хэша
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16)
}

/**
 * Полная обработка поискового запроса
 */
export function processSearchQuery(query: string, userId?: string, ipHash?: string): {
  processed: string
  hash: string
  valid: boolean
  reason?: string
} {
  const normalized = normalizeQuery(query)
  const validation = isValidQuery(normalized)
  
  if (!validation.valid) {
    return {
      processed: normalized,
      hash: '',
      valid: false,
      reason: validation.reason
    }
  }

  const filtered = filterStopWords(normalized)
  const hash = createQueryHash(filtered, userId, ipHash)

  return {
    processed: filtered,
    hash,
    valid: true
  }
}
