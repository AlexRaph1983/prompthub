import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildSparseVector,
  cosineSimilarity,
  parseTags,
  bayesianAverage,
  computePromptBayesian,
  computePromptPopularity,
  buildSparseVectorTfidf,
  computeIdfForTags,
  SparseVector,
} from '@/lib/recommend'

describe('Recommendation Scoring', () => {
  describe('buildSparseVector', () => {
    it('builds and L2-normalizes vectors correctly', () => {
      const v = buildSparseVector({
        tags: ['AI', 'GPT'],
        category: 'marketing',
        model: 'gpt-4',
        lang: 'en',
      })
      
      // Check keys are lowercase
      expect(v['tag:ai']).toBeDefined()
      expect(v['tag:gpt']).toBeDefined()
      expect(v['cat:marketing']).toBeDefined()
      expect(v['model:gpt-4']).toBeDefined()
      expect(v['lang:en']).toBeDefined()
      
      // Verify L2 normalization
      const l2 = Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0))
      expect(l2).toBeCloseTo(1, 5)
    })
    
    it('handles empty inputs gracefully', () => {
      const v = buildSparseVector({
        tags: [],
        category: '',
        model: '',
        lang: '',
      })
      
      expect(Object.keys(v).length).toBe(0)
    })
  })
  
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = buildSparseVector({
        tags: ['test'],
        category: 'cat',
        model: 'm',
        lang: 'en',
      })
      
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
    })
    
    it('returns 0 for orthogonal vectors', () => {
      const a: SparseVector = { 'tag:a': 1 }
      const b: SparseVector = { 'tag:b': 1 }
      
      expect(cosineSimilarity(a, b)).toBe(0)
    })
    
    it('returns higher similarity for more similar vectors', () => {
      const base = buildSparseVector({
        tags: ['ai', 'gpt', 'coding'],
        category: 'development',
        model: 'gpt-4',
        lang: 'en',
      })
      
      const similar = buildSparseVector({
        tags: ['ai', 'gpt', 'programming'],
        category: 'development',
        model: 'gpt-4',
        lang: 'en',
      })
      
      const different = buildSparseVector({
        tags: ['cooking', 'recipes'],
        category: 'lifestyle',
        model: 'claude',
        lang: 'ru',
      })
      
      const simSimilar = cosineSimilarity(base, similar)
      const simDifferent = cosineSimilarity(base, different)
      
      expect(simSimilar).toBeGreaterThan(simDifferent)
      expect(simSimilar).toBeGreaterThan(0.5)
      expect(simDifferent).toBeLessThan(0.3)
    })
  })
  
  describe('bayesianAverage', () => {
    it('pulls towards global average for low rating count', () => {
      const globalAvg = 3.5
      const m = 5
      
      // 1 rating of 5 should be pulled towards 3.5
      const score = bayesianAverage(5, 1, globalAvg, m)
      expect(score).toBeLessThan(5)
      expect(score).toBeGreaterThan(3.5)
    })
    
    it('approaches actual rating with more ratings', () => {
      const globalAvg = 3.5
      const m = 5
      
      const score1 = bayesianAverage(5, 1, globalAvg, m)
      const score10 = bayesianAverage(5, 10, globalAvg, m)
      const score100 = bayesianAverage(5, 100, globalAvg, m)
      
      expect(score10).toBeGreaterThan(score1)
      expect(score100).toBeGreaterThan(score10)
      expect(score100).toBeCloseTo(5, 0) // within 0.5
    })
    
    it('handles edge cases', () => {
      expect(bayesianAverage(0, 0, 3.5, 5)).toBe(3.5)
      expect(bayesianAverage(5, 0, 3.5, 5)).toBe(3.5)
    })
  })
  
  describe('computePromptPopularity', () => {
    it('calculates weighted popularity score', () => {
      const prompt = {
        _count: { likes: 10, saves: 5, comments: 2, ratings: 8 },
        totalRatings: 8,
        averageRating: 4.5,
      }
      
      const pop = computePromptPopularity(prompt as any)
      
      // likes*1 + saves*1.2 + comments*1.5 + ratings*0.5
      const expected = 10 * 1 + 5 * 1.2 + 2 * 1.5 + 8 * 0.5
      expect(pop).toBe(expected)
    })
    
    it('returns 0 for empty counts', () => {
      const prompt = {
        _count: { likes: 0, saves: 0, comments: 0, ratings: 0 },
        totalRatings: 0,
        averageRating: 0,
      }
      
      expect(computePromptPopularity(prompt as any)).toBe(0)
    })
  })
  
  describe('TF-IDF vectors', () => {
    it('computes IDF correctly', () => {
      const prompts = [
        { id: '1', tags: 'ai, gpt', category: 'dev', model: 'm', lang: 'en' },
        { id: '2', tags: 'ai, coding', category: 'dev', model: 'm', lang: 'en' },
        { id: '3', tags: 'cooking', category: 'life', model: 'm', lang: 'ru' },
      ]
      
      const idf = computeIdfForTags(prompts as any)
      
      // 'ai' appears in 2/3 docs, should have lower IDF than 'cooking' (1/3 docs)
      expect(idf['ai']).toBeLessThan(idf['cooking'])
    })
    
    it('builds TF-IDF weighted vectors', () => {
      const prompts = [
        { id: '1', tags: 'ai, gpt', category: 'dev', model: 'm', lang: 'en' },
        { id: '2', tags: 'ai, coding', category: 'dev', model: 'm', lang: 'en' },
      ]
      
      const idf = computeIdfForTags(prompts as any)
      
      const v = buildSparseVectorTfidf(
        { tags: ['ai', 'gpt'], category: 'dev', model: 'm', lang: 'en' },
        idf
      )
      
      expect(v['tag:ai']).toBeDefined()
      expect(v['tag:gpt']).toBeDefined()
      expect(v['cat:dev']).toBeDefined()
      
      // Verify L2 normalization
      const l2 = Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0))
      expect(l2).toBeCloseTo(1, 5)
    })
  })
})

describe('Decay Functions', () => {
  it('applies exponential decay based on age', () => {
    const halfLifeMs = 14 * 24 * 60 * 60 * 1000 // 14 days
    
    const decay = (ageMs: number) => Math.pow(0.5, ageMs / halfLifeMs)
    
    // Fresh interaction
    expect(decay(0)).toBe(1)
    
    // 14 days old = half weight
    expect(decay(halfLifeMs)).toBeCloseTo(0.5, 5)
    
    // 28 days old = quarter weight
    expect(decay(2 * halfLifeMs)).toBeCloseTo(0.25, 5)
    
    // Very old = near zero
    expect(decay(10 * halfLifeMs)).toBeLessThan(0.01)
  })
  
  it('freshness decay for prompt age', () => {
    const freshnessDecayMs = 30 * 24 * 60 * 60 * 1000 // 30 days
    
    const freshness = (ageMs: number) => Math.exp(-ageMs / freshnessDecayMs)
    
    // Brand new
    expect(freshness(0)).toBe(1)
    
    // 30 days old
    expect(freshness(freshnessDecayMs)).toBeCloseTo(1 / Math.E, 5)
    
    // Very old
    expect(freshness(5 * freshnessDecayMs)).toBeLessThan(0.01)
  })
})


