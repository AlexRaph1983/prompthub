import { describe, it, expect } from 'vitest'
import { calculateReputation } from '@/lib/reputation'

describe('calculateReputation', () => {
  it('normalizes score 0..100 and tiers', () => {
    const low = calculateReputation({ avgPromptRating: 0, ratingsCount: 0, promptCount: 0, likesCount: 0, savesCount: 0, commentsCount: 0 })
    expect(low.score0to100).toBeGreaterThanOrEqual(0)
    expect(low.tier).toBe('bronze')
    const high = calculateReputation({ avgPromptRating: 5, ratingsCount: 200, promptCount: 50, likesCount: 200, savesCount: 100, commentsCount: 100 })
    expect(high.score0to100).toBeLessThanOrEqual(100)
    expect(['gold', 'platinum']).toContain(high.tier)
  })
})


