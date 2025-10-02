/**
 * Клиентская фильтрация поисковых запросов
 */

// Стоп-слова для блокировки
const STOP_WORDS = new Set([
  'spam', 'test', 'тест', 'фон', 'функ', 'провер', 'проверка', 'проверяю',
  'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
])

/**
 * Удаление emoji из строки
 */
export function stripEmojis(text: string): string {
  if (!text) return ''
  
  // Regex для удаления emoji и других Unicode символов
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
}

/**
 * Сжатие повторяющихся символов
 */
export function collapseRepeatedChars(text: string): string {
  if (!text) return ''
  
  // Удаляем повторяющиеся символы (более 2 подряд)
  return text.replace(/(.)\1{2,}/g, '$1$1')
}

/**
 * Подсчет букв в строке
 */
export function countLetters(text: string): number {
  if (!text) return 0
  
  // Подсчитываем только буквы (латиница и кириллица)
  return text.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '').length
}

/**
 * Проверка на стоп-слова
 */
export function isStopWord(text: string): boolean {
  if (!text) return false
  
  const normalized = text.toLowerCase().trim()
  return STOP_WORDS.has(normalized)
}

/**
 * Проверка минимального количества букв
 */
export function hasMinLetters(text: string, minLetters: number = 2): boolean {
  return countLetters(text) >= minLetters
}

/**
 * Основная функция клиентской фильтрации
 */
export function filterSearchQuery(query: string): {
  filtered: string
  isValid: boolean
  reason?: string
} {
  if (!query || typeof query !== 'string') {
    return {
      filtered: '',
      isValid: false,
      reason: 'EMPTY_QUERY'
    }
  }

  // Удаляем emoji
  let filtered = stripEmojis(query)
  
  // Сжимаем повторяющиеся символы
  filtered = collapseRepeatedChars(filtered)
  
  // Trim и нормализация
  filtered = filtered.trim()
  
  // Проверка на пустоту после фильтрации
  if (!filtered) {
    return {
      filtered: '',
      isValid: false,
      reason: 'EMPTY_AFTER_FILTERING'
    }
  }
  
  // Проверка на стоп-слова
  if (isStopWord(filtered)) {
    return {
      filtered,
      isValid: false,
      reason: 'STOP_WORD'
    }
  }
  
  // Проверка минимального количества букв
  if (!hasMinLetters(filtered, 2)) {
    return {
      filtered,
      isValid: false,
      reason: 'INSUFFICIENT_LETTERS'
    }
  }
  
  return {
    filtered,
    isValid: true
  }
}

/**
 * Получение описания причины отклонения
 */
export function getFilterRejectionReason(reason: string): string {
  const reasons: Record<string, string> = {
    'EMPTY_QUERY': 'Пустой запрос',
    'EMPTY_AFTER_FILTERING': 'Пустой запрос после фильтрации',
    'STOP_WORD': 'Запрос в стоп-листе',
    'INSUFFICIENT_LETTERS': 'Недостаточно букв (минимум 2)'
  }
  
  return reasons[reason] || 'Неизвестная причина'
}
