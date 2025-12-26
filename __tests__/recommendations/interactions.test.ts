import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkInteractionRateLimit,
  recordInteraction,
  createAnonymousActorId,
  INTERACTION_CONFIG,
} from '@/lib/services/interactionService'

// Mock Redis
vi.mock('@/lib/redis', () => {
  const store = new Map<string, { value: string; expireAt?: number }>()
  
  return {
    getRedis: vi.fn().mockResolvedValue({
      get: vi.fn().mockImplementation(async (key: string) => {
        const entry = store.get(key)
        if (!entry) return null
        if (entry.expireAt && Date.now() > entry.expireAt) {
          store.delete(key)
          return null
        }
        return entry.value
      }),
      set: vi.fn().mockImplementation(async (key: string, value: string, _ex?: string, ttl?: number) => {
        store.set(key, {
          value,
          expireAt: ttl ? Date.now() + ttl * 1000 : undefined,
        })
        return 'OK'
      }),
      incr: vi.fn().mockImplementation(async (key: string) => {
        const entry = store.get(key)
        const newVal = entry ? parseInt(entry.value, 10) + 1 : 1
        store.set(key, { value: String(newVal), expireAt: entry?.expireAt })
        return newVal
      }),
      expire: vi.fn().mockImplementation(async (key: string, ttl: number) => {
        const entry = store.get(key)
        if (entry) {
          entry.expireAt = Date.now() + ttl * 1000
        }
        return 1
      }),
      del: vi.fn().mockImplementation(async (key: string) => {
        store.delete(key)
        return 1
      }),
      // Helper for tests
      _clear: () => store.clear(),
      _store: store,
    }),
  }
})

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    promptInteraction: {
      create: vi.fn().mockResolvedValue({
        id: 'test-interaction-id',
        userId: 'test-user',
        promptId: 'test-prompt',
        type: 'copy',
        weight: 1,
        createdAt: new Date(),
      }),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Interaction Rate Limiting', () => {
  beforeEach(async () => {
    const { getRedis } = await import('@/lib/redis')
    const redis = await getRedis()
    ;(redis as any)._clear()
  })
  
  describe('createAnonymousActorId', () => {
    it('creates consistent hash for same inputs', () => {
      const id1 = createAnonymousActorId('1.2.3.4', 'Mozilla/5.0')
      const id2 = createAnonymousActorId('1.2.3.4', 'Mozilla/5.0')
      
      expect(id1).toBe(id2)
      expect(id1).toMatch(/^anon:[a-f0-9]{32}$/)
    })
    
    it('creates different hash for different inputs', () => {
      const id1 = createAnonymousActorId('1.2.3.4', 'Mozilla/5.0')
      const id2 = createAnonymousActorId('5.6.7.8', 'Mozilla/5.0')
      const id3 = createAnonymousActorId('1.2.3.4', 'Chrome/100')
      
      expect(id1).not.toBe(id2)
      expect(id1).not.toBe(id3)
    })
  })
  
  describe('checkInteractionRateLimit', () => {
    it('allows first interaction', async () => {
      const result = await checkInteractionRateLimit('user1', 'prompt1', 'copy')
      
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })
    
    it('blocks too frequent interactions', async () => {
      const actorId = 'user-fast'
      const promptId = 'prompt-spam'
      
      // First interaction
      const first = await checkInteractionRateLimit(actorId, promptId, 'copy')
      expect(first.allowed).toBe(true)
      
      // Immediate second interaction should be blocked (MIN_INTERVAL)
      const second = await checkInteractionRateLimit(actorId, promptId, 'copy')
      expect(second.allowed).toBe(false)
      expect(second.reason).toBe('TOO_FREQUENT')
      expect(second.retryAfter).toBeGreaterThan(0)
    })
    
    it('allows different interaction types on same prompt', async () => {
      const actorId = 'user-varied'
      const promptId = 'prompt-varied'
      
      const copy = await checkInteractionRateLimit(actorId, promptId, 'copy')
      const view = await checkInteractionRateLimit(actorId, promptId, 'view')
      const like = await checkInteractionRateLimit(actorId, promptId, 'like')
      
      expect(copy.allowed).toBe(true)
      expect(view.allowed).toBe(true)
      expect(like.allowed).toBe(true)
    })
    
    it('allows same type on different prompts', async () => {
      const actorId = 'user-multi'
      
      const r1 = await checkInteractionRateLimit(actorId, 'prompt1', 'copy')
      const r2 = await checkInteractionRateLimit(actorId, 'prompt2', 'copy')
      
      expect(r1.allowed).toBe(true)
      expect(r2.allowed).toBe(true)
    })
  })
  
  describe('recordInteraction', () => {
    it('records valid interaction', async () => {
      const result = await recordInteraction(
        {
          promptId: 'test-prompt',
          type: 'copy',
          userId: 'test-user',
        },
        {
          ip: '1.2.3.4',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-123',
        }
      )
      
      expect(result.success).toBe(true)
      expect(result.interaction?.id).toBeDefined()
    })
    
    it('blocks rate-limited interaction', async () => {
      // First - should succeed
      const first = await recordInteraction(
        { promptId: 'spam-prompt', type: 'copy', userId: 'spammer' },
        { requestId: 'req-1' }
      )
      expect(first.success).toBe(true)
      
      // Second immediate - should be blocked
      const second = await recordInteraction(
        { promptId: 'spam-prompt', type: 'copy', userId: 'spammer' },
        { requestId: 'req-2' }
      )
      expect(second.success).toBe(false)
      expect(second.rateLimited).toBe(true)
    })
    
    it('uses anonymous ID for unauthenticated users', async () => {
      const result = await recordInteraction(
        {
          promptId: 'test-prompt',
          type: 'view',
          // No userId - anonymous
        },
        {
          ip: '10.0.0.1',
          userAgent: 'Test Agent',
          requestId: 'req-anon',
        }
      )
      
      expect(result.success).toBe(true)
    })
  })
})

describe('Interaction Configuration', () => {
  it('has all interaction types configured', () => {
    const types = ['view', 'copy', 'like', 'save', 'open']
    
    for (const type of types) {
      expect(INTERACTION_CONFIG.RATE_LIMITS[type]).toBeDefined()
      expect(INTERACTION_CONFIG.MIN_INTERVAL_SECONDS[type]).toBeDefined()
      expect(INTERACTION_CONFIG.INTERACTION_WEIGHTS[type]).toBeDefined()
    }
  })
  
  it('has reasonable rate limits', () => {
    // Copy should have stricter limit than view
    expect(INTERACTION_CONFIG.RATE_LIMITS.copy).toBeLessThan(INTERACTION_CONFIG.RATE_LIMITS.view)
    
    // All limits should be positive
    for (const limit of Object.values(INTERACTION_CONFIG.RATE_LIMITS)) {
      expect(limit).toBeGreaterThan(0)
    }
  })
  
  it('has reasonable min intervals', () => {
    // All intervals should be positive
    for (const interval of Object.values(INTERACTION_CONFIG.MIN_INTERVAL_SECONDS)) {
      expect(interval).toBeGreaterThan(0)
    }
    // View can have longer cooldown to prevent spam
    expect(INTERACTION_CONFIG.MIN_INTERVAL_SECONDS.view).toBeGreaterThan(0)
  })
  
  it('has weights summing to meaningful values', () => {
    // Copy should be strongest
    expect(INTERACTION_CONFIG.INTERACTION_WEIGHTS.copy).toBe(
      Math.max(...Object.values(INTERACTION_CONFIG.INTERACTION_WEIGHTS))
    )
    
    // View should be weakest
    expect(INTERACTION_CONFIG.INTERACTION_WEIGHTS.view).toBe(
      Math.min(...Object.values(INTERACTION_CONFIG.INTERACTION_WEIGHTS))
    )
  })
})


