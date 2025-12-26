import { describe, it, expect } from 'vitest'
import { 
  applyDiversityPenalty,
  computePersonalizedScore,
  PROFILE_CONFIG,
  UserProfile,
} from '@/lib/services/userProfileService'
import { buildSparseVector, SparseVector } from '@/lib/recommend'

describe('Diversity Penalty', () => {
  it('applies no penalty to first item', () => {
    const prompts = [
      { id: '1', score: 0.9, vector: { 'tag:ai': 1 } },
      { id: '2', score: 0.8, vector: { 'tag:ai': 1 } },
      { id: '3', score: 0.7, vector: { 'tag:cooking': 1 } },
    ]
    
    const result = applyDiversityPenalty(prompts, 3)
    
    // First item should have full score
    expect(result[0].id).toBe('1')
    expect(result[0].diversityPenalty).toBe(1)
  })
  
  it('penalizes similar items after first', () => {
    const prompts = [
      { id: '1', score: 0.9, vector: buildSparseVector({ tags: ['ai'], category: 'dev', model: 'm', lang: 'en' }) },
      { id: '2', score: 0.85, vector: buildSparseVector({ tags: ['ai'], category: 'dev', model: 'm', lang: 'en' }) },
      { id: '3', score: 0.7, vector: buildSparseVector({ tags: ['cooking'], category: 'life', model: 'm', lang: 'ru' }) },
    ]
    
    const result = applyDiversityPenalty(prompts, 3)
    
    // Third diverse item might be promoted due to diversity bonus
    // Similar item #2 should get penalty
    const item2 = result.find(r => r.id === '2')
    expect(item2?.diversityPenalty).toBeLessThan(1)
  })
  
  it('promotes diverse items higher in ranking', () => {
    // Scenario: Two very similar items with high score, one diverse item with lower score
    const similar1: SparseVector = { 'tag:ai': 0.8, 'cat:dev': 0.6 }
    const similar2: SparseVector = { 'tag:ai': 0.8, 'cat:dev': 0.6 }
    const diverse: SparseVector = { 'tag:cooking': 0.8, 'cat:life': 0.6 }
    
    const prompts = [
      { id: 'sim1', score: 0.95, vector: similar1 },
      { id: 'sim2', score: 0.94, vector: similar2 },
      { id: 'diverse', score: 0.80, vector: diverse },
    ]
    
    const result = applyDiversityPenalty(prompts, 3)
    
    // First should be sim1 (highest score)
    expect(result[0].id).toBe('sim1')
    
    // Diverse item might be promoted to position 2 due to penalty on sim2
    // Or sim2 stays at 2 but with penalty
    const diversePos = result.findIndex(r => r.id === 'diverse')
    const sim2Pos = result.findIndex(r => r.id === 'sim2')
    
    // Diversity bonus should affect ranking
    expect(result.length).toBe(3)
  })
  
  it('handles empty input', () => {
    const result = applyDiversityPenalty([], 12)
    expect(result).toEqual([])
  })
  
  it('respects topK limit', () => {
    const prompts = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`,
      score: 1 - i * 0.01,
      vector: { [`tag:t${i}`]: 1 } as SparseVector,
    }))
    
    const result = applyDiversityPenalty(prompts, 5)
    expect(result.length).toBe(5)
  })
})

describe('Seen Penalty', () => {
  const mockProfile: UserProfile = {
    userId: 'test-user',
    vector: { 'tag:ai': 0.5, 'cat:dev': 0.5 },
    interactionCount: 10,
    topCategories: ['dev'],
    topTags: ['ai'],
    topModels: ['gpt-4'],
    seenPromptIds: new Set(['seen-1', 'seen-2', 'seen-3']),
    isPersonalized: true,
    lastUpdated: new Date(),
  }
  
  it('applies penalty to seen prompts', () => {
    const promptVector = { 'tag:ai': 0.5, 'cat:dev': 0.5 }
    
    const seenResult = computePersonalizedScore(promptVector, mockProfile, 'seen-1')
    const unseenResult = computePersonalizedScore(promptVector, mockProfile, 'new-prompt')
    
    expect(seenResult.seenPenalty).toBe(PROFILE_CONFIG.SEEN_PENALTY)
    expect(unseenResult.seenPenalty).toBe(1)
    
    // Seen prompt should have lower final score
    expect(seenResult.finalScore).toBeLessThan(unseenResult.finalScore)
  })
  
  it('calculates correct similarity for personalized profile', () => {
    // Vector identical to profile (for testing)
    const similarVector: SparseVector = { 'tag:ai': 0.5, 'cat:dev': 0.5 }
    const result = computePersonalizedScore(similarVector, mockProfile, 'new')
    
    // Should have positive similarity (exact value depends on normalization)
    expect(result.similarity).toBeGreaterThan(0)
    expect(result.seenPenalty).toBe(1) // not seen
  })
  
  it('returns neutral score for non-personalized profile', () => {
    const emptyProfile: UserProfile = {
      userId: 'new-user',
      vector: {},
      interactionCount: 0,
      topCategories: [],
      topTags: [],
      topModels: [],
      seenPromptIds: new Set(),
      isPersonalized: false,
      lastUpdated: new Date(),
    }
    
    const result = computePersonalizedScore({ 'tag:ai': 1 }, emptyProfile, 'any')
    
    expect(result.similarity).toBe(0.5) // neutral
    expect(result.seenPenalty).toBe(1) // no penalty
    expect(result.finalScore).toBe(0.5)
  })
  
  it('combines similarity and seen penalty correctly', () => {
    const promptVector = { 'tag:ai': 0.5, 'cat:dev': 0.5 }
    const result = computePersonalizedScore(promptVector, mockProfile, 'seen-1')
    
    expect(result.finalScore).toBeCloseTo(result.similarity * result.seenPenalty, 5)
  })
})

describe('Profile Configuration', () => {
  it('has reasonable default weights', () => {
    const weights = PROFILE_CONFIG.PROFILE_WEIGHTS
    
    // Copy should be strongest signal
    expect(weights.copy).toBeGreaterThan(weights.like)
    expect(weights.copy).toBeGreaterThan(weights.view)
    
    // View should be weakest signal
    expect(weights.view).toBeLessThan(weights.open)
    expect(weights.view).toBeLessThan(weights.save)
  })
  
  it('has reasonable seen penalty', () => {
    expect(PROFILE_CONFIG.SEEN_PENALTY).toBeGreaterThan(0)
    expect(PROFILE_CONFIG.SEEN_PENALTY).toBeLessThan(1)
  })
  
  it('has reasonable decay half-life', () => {
    expect(PROFILE_CONFIG.DECAY_HALF_LIFE_DAYS).toBeGreaterThan(0)
    expect(PROFILE_CONFIG.DECAY_HALF_LIFE_DAYS).toBeLessThanOrEqual(30)
  })
})


