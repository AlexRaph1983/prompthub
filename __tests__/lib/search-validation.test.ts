import { 
  normalizeUnicode,
  calculateLetterPercentage,
  getMaxConsecutiveChars,
  hasOnlyNumbers,
  hasOnlySpecialChars,
  validateSearchQuery,
  createQueryHash,
  getRejectionReasonDescription
} from '@/lib/search-validation'

describe('Search Validation', () => {
  describe('normalizeUnicode', () => {
    it('should normalize Unicode characters', () => {
      expect(normalizeUnicode('café')).toBe('café')
    })

    it('should trim and lowercase', () => {
      expect(normalizeUnicode('  HELLO WORLD  ')).toBe('hello world')
    })

    it('should remove multiple spaces', () => {
      expect(normalizeUnicode('hello    world')).toBe('hello world')
    })

    it('should handle empty string', () => {
      expect(normalizeUnicode('')).toBe('')
    })
  })

  describe('calculateLetterPercentage', () => {
    it('should calculate letter percentage correctly', () => {
      expect(calculateLetterPercentage('hello')).toBe(100)
      expect(calculateLetterPercentage('hello123')).toBe(71) // 5/7 * 100
      expect(calculateLetterPercentage('123456')).toBe(0)
      expect(calculateLetterPercentage('hello world')).toBe(100) // spaces ignored
    })

    it('should handle Cyrillic letters', () => {
      expect(calculateLetterPercentage('привет')).toBe(100)
      expect(calculateLetterPercentage('привет123')).toBe(86) // 6/7 * 100
    })
  })

  describe('getMaxConsecutiveChars', () => {
    it('should find maximum consecutive characters', () => {
      expect(getMaxConsecutiveChars('hello')).toBe(2) // 'll'
      expect(getMaxConsecutiveChars('aaaabbb')).toBe(4) // 'aaaa'
      expect(getMaxConsecutiveChars('abc')).toBe(1)
      expect(getMaxConsecutiveChars('')).toBe(0)
    })
  })

  describe('hasOnlyNumbers', () => {
    it('should detect numbers only', () => {
      expect(hasOnlyNumbers('123456')).toBe(true)
      expect(hasOnlyNumbers('123 456')).toBe(true) // spaces ignored
      expect(hasOnlyNumbers('hello123')).toBe(false)
      expect(hasOnlyNumbers('hello')).toBe(false)
    })
  })

  describe('hasOnlySpecialChars', () => {
    it('should detect special chars only', () => {
      expect(hasOnlySpecialChars('!@#$%')).toBe(true)
      expect(hasOnlySpecialChars('!@# $%')).toBe(true) // spaces ignored
      expect(hasOnlySpecialChars('hello!')).toBe(false)
      expect(hasOnlySpecialChars('hello')).toBe(false)
    })
  })

  describe('validateSearchQuery', () => {
    it('should reject missing query', () => {
      const result = validateSearchQuery('', true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('MISSING_QUERY')
    })

    it('should reject unfinished query', () => {
      const result = validateSearchQuery('hello', false)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('QUERY_NOT_FINISHED')
    })

    it('should reject short query', () => {
      const result = validateSearchQuery('ab', true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('TOO_SHORT')
    })

    it('should reject long query', () => {
      const longQuery = 'a'.repeat(201)
      const result = validateSearchQuery(longQuery, true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('TOO_LONG')
    })

    it('should reject query with insufficient letters', () => {
      const result = validateSearchQuery('123456789', true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('INSUFFICIENT_LETTERS')
    })

    it('should reject query with too many consecutive chars', () => {
      const result = validateSearchQuery('aaaaa', true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('TOO_MANY_CONSECUTIVE_CHARS')
    })

    it('should reject numbers only', () => {
      const result = validateSearchQuery('123456', true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('ONLY_NUMBERS')
    })

    it('should reject special chars only', () => {
      const result = validateSearchQuery('!@#$%', true)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('ONLY_SPECIAL_CHARS')
    })

    it('should accept valid query', () => {
      const result = validateSearchQuery('hello world', true)
      expect(result.valid).toBe(true)
      expect(result.normalizedQuery).toBe('hello world')
      expect(result.metrics).toBeDefined()
    })

    it('should normalize query', () => {
      const result = validateSearchQuery('  HELLO    WORLD  ', true)
      expect(result.valid).toBe(true)
      expect(result.normalizedQuery).toBe('hello world')
    })
  })

  describe('createQueryHash', () => {
    it('should create consistent hash', () => {
      const hash1 = createQueryHash('hello', 'user1')
      const hash2 = createQueryHash('hello', 'user1')
      expect(hash1).toBe(hash2)
    })

    it('should create different hashes for different users', () => {
      const hash1 = createQueryHash('hello', 'user1')
      const hash2 = createQueryHash('hello', 'user2')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('getRejectionReasonDescription', () => {
    it('should return human readable descriptions', () => {
      expect(getRejectionReasonDescription('TOO_SHORT')).toBe('Слишком короткий запрос (менее 3 символов)')
      expect(getRejectionReasonDescription('INSUFFICIENT_LETTERS')).toBe('Недостаточно букв (менее 40%)')
      expect(getRejectionReasonDescription('UNKNOWN_REASON')).toBe('Неизвестная причина')
    })
  })
})
