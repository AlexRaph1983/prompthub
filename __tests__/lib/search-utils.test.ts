import { 
  normalizeQuery, 
  filterStopWords, 
  isValidQuery, 
  createQueryHash, 
  processSearchQuery 
} from '@/lib/search-utils'

describe('Search Utils', () => {
  describe('normalizeQuery', () => {
    it('should trim and lowercase query', () => {
      expect(normalizeQuery('  HELLO WORLD  ')).toBe('hello world')
    })

    it('should normalize Unicode characters', () => {
      expect(normalizeQuery('café')).toBe('café')
    })

    it('should remove multiple spaces', () => {
      expect(normalizeQuery('hello    world')).toBe('hello world')
    })

    it('should limit repeated characters', () => {
      expect(normalizeQuery('helllllo')).toBe('helllo')
    })

    it('should handle empty string', () => {
      expect(normalizeQuery('')).toBe('')
    })
  })

  describe('filterStopWords', () => {
    it('should remove stop words', () => {
      expect(filterStopWords('hello and world')).toBe('hello world')
    })

    it('should remove multiple stop words', () => {
      expect(filterStopWords('the quick brown fox')).toBe('quick brown fox')
    })

    it('should handle Russian stop words', () => {
      expect(filterStopWords('привет и мир')).toBe('привет мир')
    })

    it('should preserve non-stop words', () => {
      expect(filterStopWords('search query')).toBe('search query')
    })
  })

  describe('isValidQuery', () => {
    it('should reject empty query', () => {
      const result = isValidQuery('')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Query is required')
    })

    it('should reject short query', () => {
      const result = isValidQuery('ab')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Query too short (minimum 3 characters)')
    })

    it('should reject long query', () => {
      const longQuery = 'a'.repeat(101)
      const result = isValidQuery(longQuery)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Query too long (maximum 100 characters)')
    })

    it('should reject invalid characters', () => {
      const result = isValidQuery('hello@world')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Query contains invalid characters')
    })

    it('should reject query with only stop words', () => {
      const result = isValidQuery('and or the')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Query contains only stop words')
    })

    it('should accept valid query', () => {
      const result = isValidQuery('hello world')
      expect(result.valid).toBe(true)
    })

    it('should accept Cyrillic query', () => {
      const result = isValidQuery('привет мир')
      expect(result.valid).toBe(true)
    })
  })

  describe('createQueryHash', () => {
    it('should create consistent hash for same query', () => {
      const hash1 = createQueryHash('hello world', 'user1')
      const hash2 = createQueryHash('hello world', 'user1')
      expect(hash1).toBe(hash2)
    })

    it('should create different hashes for different users', () => {
      const hash1 = createQueryHash('hello world', 'user1')
      const hash2 = createQueryHash('hello world', 'user2')
      expect(hash1).not.toBe(hash2)
    })

    it('should create different hashes for different queries', () => {
      const hash1 = createQueryHash('hello world', 'user1')
      const hash2 = createQueryHash('hello universe', 'user1')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('processSearchQuery', () => {
    it('should process valid query successfully', () => {
      const result = processSearchQuery('Hello World!', 'user1')
      expect(result.valid).toBe(true)
      expect(result.processed).toBe('hello world')
      expect(result.hash).toBeTruthy()
    })

    it('should reject invalid query', () => {
      const result = processSearchQuery('ab')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Query too short (minimum 3 characters)')
    })

    it('should normalize and filter query', () => {
      const result = processSearchQuery('  HELLO AND WORLD  ', 'user1')
      expect(result.valid).toBe(true)
      expect(result.processed).toBe('hello world')
    })
  })
})
