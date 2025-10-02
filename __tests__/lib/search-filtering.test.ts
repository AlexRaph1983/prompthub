import { 
  stripEmojis,
  collapseRepeatedChars,
  countLetters,
  isStopWord,
  hasMinLetters,
  filterSearchQuery,
  getFilterRejectionReason
} from '@/lib/search-filtering'

describe('Search Filtering', () => {
  describe('stripEmojis', () => {
    it('should remove emojis from text', () => {
      expect(stripEmojis('Hello 😀 world 🌍')).toBe('Hello  world ')
      expect(stripEmojis('Test 🚀 query')).toBe('Test  query')
      expect(stripEmojis('No emojis here')).toBe('No emojis here')
    })

    it('should handle empty string', () => {
      expect(stripEmojis('')).toBe('')
    })
  })

  describe('collapseRepeatedChars', () => {
    it('should collapse repeated characters', () => {
      expect(collapseRepeatedChars('helllllo')).toBe('helllo')
      expect(collapseRepeatedChars('aaaaa')).toBe('aa')
      expect(collapseRepeatedChars('normal text')).toBe('normal text')
    })

    it('should handle empty string', () => {
      expect(collapseRepeatedChars('')).toBe('')
    })
  })

  describe('countLetters', () => {
    it('should count only letters', () => {
      expect(countLetters('hello')).toBe(5)
      expect(countLetters('hello123')).toBe(5)
      expect(countLetters('hello world')).toBe(10)
      expect(countLetters('привет')).toBe(6)
      expect(countLetters('123456')).toBe(0)
    })

    it('should handle empty string', () => {
      expect(countLetters('')).toBe(0)
    })
  })

  describe('isStopWord', () => {
    it('should detect stop words', () => {
      expect(isStopWord('spam')).toBe(true)
      expect(isStopWord('test')).toBe(true)
      expect(isStopWord('фон')).toBe(true)
      expect(isStopWord('hello')).toBe(false)
      expect(isStopWord('valid query')).toBe(false)
    })

    it('should handle empty string', () => {
      expect(isStopWord('')).toBe(false)
    })
  })

  describe('hasMinLetters', () => {
    it('should check minimum letters', () => {
      expect(hasMinLetters('hello', 2)).toBe(true)
      expect(hasMinLetters('hi', 2)).toBe(true)
      expect(hasMinLetters('a', 2)).toBe(false)
      expect(hasMinLetters('123', 2)).toBe(false)
    })

    it('should handle empty string', () => {
      expect(hasMinLetters('', 2)).toBe(false)
    })
  })

  describe('filterSearchQuery', () => {
    it('should filter valid queries', () => {
      const result = filterSearchQuery('hello world')
      expect(result.isValid).toBe(true)
      expect(result.filtered).toBe('hello world')
    })

    it('should reject empty queries', () => {
      const result = filterSearchQuery('')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('EMPTY_QUERY')
    })

    it('should reject stop words', () => {
      const result = filterSearchQuery('spam')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('STOP_WORD')
    })

    it('should reject queries with insufficient letters', () => {
      const result = filterSearchQuery('a')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('INSUFFICIENT_LETTERS')
    })

    it('should strip emojis and collapse repeated chars', () => {
      const result = filterSearchQuery('helllllo 😀 world')
      expect(result.isValid).toBe(true)
      expect(result.filtered).toBe('helllo  world')
    })

    it('should reject queries that become empty after filtering', () => {
      const result = filterSearchQuery('😀😀😀')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('EMPTY_AFTER_FILTERING')
    })
  })

  describe('getFilterRejectionReason', () => {
    it('should return human readable reasons', () => {
      expect(getFilterRejectionReason('EMPTY_QUERY')).toBe('Пустой запрос')
      expect(getFilterRejectionReason('STOP_WORD')).toBe('Запрос в стоп-листе')
      expect(getFilterRejectionReason('INSUFFICIENT_LETTERS')).toBe('Недостаточно букв (минимум 2)')
      expect(getFilterRejectionReason('UNKNOWN_REASON')).toBe('Неизвестная причина')
    })
  })
})
