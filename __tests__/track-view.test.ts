import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/track-view/route'
import { prisma } from '@/lib/prisma'
import { getRedis } from '@/lib/redis'
import { AntifraudEngine } from '@/lib/antifraud'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    prompt: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
}))

vi.mock('@/lib/antifraud', () => ({
  AntifraudEngine: {
    check: vi.fn(),
  },
}))

vi.mock('@/lib/viewsIntegration', () => ({
  onViewsUpdated: vi.fn(),
}))

vi.mock('@/lib/promptViewService', () => ({
  recordPromptViewEvent: vi.fn(),
  computeIpHash: vi.fn((ip) => ip ? `hash-${ip}` : null),
  computeUaHash: vi.fn((ua) => ua ? `hash-${ua}` : null),
  normalizeFingerprint: vi.fn((fp) => fp),
}))

describe('POST /api/track-view', () => {
  let mockRedis: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
    }
    
    vi.mocked(getRedis).mockResolvedValue(mockRedis)
  })

  it('should increment views for valid token', async () => {
    // Setup
    const promptId = 'test-prompt-id'
    const viewToken = 'valid-token-123'
    
    vi.mocked(prisma.prompt.findUnique).mockResolvedValue({
      id: promptId,
      views: 10,
      authorId: 'author-1',
    } as any)
    
    mockRedis.get.mockResolvedValue(null) // Token not used
    mockRedis.set.mockResolvedValue('OK') // Dedup window OK
    
    vi.mocked(AntifraudEngine.check).mockResolvedValue({
      allowed: true,
      confidence: 0.1,
    })
    
    vi.mocked(prisma.prompt.update).mockResolvedValue({
      views: 11,
    } as any)
    
    const request = new Request('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': `http://localhost:3000/prompt/${promptId}`,
        'x-fingerprint': 'test-fp-123',
        'user-agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({ cardId: promptId, viewToken }),
    })
    
    // Execute
    const response = await POST(request as any)
    const data = await response.json()
    
    // Assert
    expect(response.status).toBe(200)
    expect(data.counted).toBe(true)
    expect(data.views).toBe(11)
    expect(mockRedis.set).toHaveBeenCalledWith(
      `token:used:${viewToken}`,
      '1',
      'EX',
      3600
    )
  })

  it('should reject reused token', async () => {
    const promptId = 'test-prompt-id'
    const viewToken = 'reused-token-123'
    
    vi.mocked(prisma.prompt.findUnique).mockResolvedValue({
      id: promptId,
      views: 10,
      authorId: 'author-1',
    } as any)
    
    mockRedis.get.mockResolvedValue('1') // Token already used
    
    const request = new Request('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': `http://localhost:3000/prompt/${promptId}`,
      },
      body: JSON.stringify({ cardId: promptId, viewToken }),
    })
    
    const response = await POST(request as any)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_OR_REUSED_TOKEN')
    expect(data.reason).toBe('TOKEN_REUSED')
    expect(data.counted).toBe(false)
  })

  it('should reject request within dedup window', async () => {
    const promptId = 'test-prompt-id'
    const viewToken = 'token-in-window'
    
    vi.mocked(prisma.prompt.findUnique).mockResolvedValue({
      id: promptId,
      views: 10,
      authorId: 'author-1',
    } as any)
    
    mockRedis.get.mockResolvedValue(null) // Token not used
    mockRedis.set.mockResolvedValue(null) // Dedup window active (not OK)
    
    const request = new Request('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': `http://localhost:3000/prompt/${promptId}`,
        'x-fingerprint': 'test-fp-123',
      },
      body: JSON.stringify({ cardId: promptId, viewToken }),
    })
    
    const response = await POST(request as any)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.counted).toBe(false)
    expect(data.reason).toBe('DEDUP_WINDOW')
    expect(data.views).toBe(10)
  })

  it('should reject request with invalid referer', async () => {
    const promptId = 'test-prompt-id'
    const viewToken = 'valid-token'
    
    vi.mocked(prisma.prompt.findUnique).mockResolvedValue({
      id: promptId,
      views: 10,
      authorId: 'author-1',
    } as any)
    
    mockRedis.get.mockResolvedValue(null)
    
    const request = new Request('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': 'http://localhost:3000/different-page',
      },
      body: JSON.stringify({ cardId: promptId, viewToken }),
    })
    
    const response = await POST(request as any)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_REFERER_FOR_VIEW')
    expect(data.reason).toBe('INVALID_REFERER')
    expect(data.counted).toBe(false)
  })

  it('should reject request blocked by antifraud', async () => {
    const promptId = 'test-prompt-id'
    const viewToken = 'valid-token'
    
    vi.mocked(prisma.prompt.findUnique).mockResolvedValue({
      id: promptId,
      views: 10,
      authorId: 'author-1',
    } as any)
    
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue('OK')
    
    vi.mocked(AntifraudEngine.check).mockResolvedValue({
      allowed: false,
      reason: 'BOT_USER_AGENT',
      confidence: 0.9,
    })
    
    const request = new Request('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'referer': `http://localhost:3000/prompt/${promptId}`,
        'user-agent': 'bot-crawler',
      },
      body: JSON.stringify({ cardId: promptId, viewToken }),
    })
    
    const response = await POST(request as any)
    const data = await response.json()
    
    expect(response.status).toBe(403)
    expect(data.error).toBe('ANTIFRAUD_BLOCKED')
    expect(data.reason).toBe('BOT_USER_AGENT')
    expect(data.counted).toBe(false)
  })

  it('should return 404 for non-existent prompt', async () => {
    vi.mocked(prisma.prompt.findUnique).mockResolvedValue(null)
    
    const request = new Request('http://localhost:3000/api/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        cardId: 'non-existent-id', 
        viewToken: 'token' 
      }),
    })
    
    const response = await POST(request as any)
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBe('NOT_FOUND')
  })
})

