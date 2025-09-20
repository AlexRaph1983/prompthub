/** @vitest-environment node */
import crypto from 'crypto'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import type { ViewTokenMeta } from '@/lib/promptViewService'

const promptStore = new Map<string, { id: string; authorId: string; views: number }>()
const promptViewEvents: Array<any> = []
const antifraudAlerts: Array<any> = []

type RedisEntry = { value: string; expiresAt?: number }

class MemoryRedis {
  private store = new Map<string, RedisEntry>()

  private resolve(key: string): RedisEntry | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry
  }

  async get(key: string) {
    const entry = this.resolve(key)
    return entry ? entry.value : null
  }

  async set(key: string, value: string, mode?: string, option?: string | number, ttlSeconds?: number) {
    let expiresAt: number | undefined
    if (mode === 'NX') {
      if (this.resolve(key)) {
        return null
      }
      if (option === 'EX' && typeof ttlSeconds === 'number') {
        expiresAt = Date.now() + ttlSeconds * 1000
      }
    } else if (mode === 'EX' && typeof option === 'number') {
      expiresAt = Date.now() + option * 1000
    }

    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async del(...keys: string[]) {
    let count = 0
    for (const key of keys) {
      if (this.store.delete(key)) {
        count += 1
      }
    }
    return count
  }

  async incr(key: string) {
    const entry = this.resolve(key)
    const current = entry ? Number(entry.value) : 0
    const next = current + 1
    this.store.set(key, { value: String(next), expiresAt: entry?.expiresAt })
    return next
  }

  async expire(key: string, ttlSeconds: number) {
    const entry = this.resolve(key)
    if (!entry) return 0
    entry.expiresAt = Date.now() + ttlSeconds * 1000
    this.store.set(key, entry)
    return 1
  }

  async flushall() {
    this.store.clear()
  }
}

const redisStub = new MemoryRedis()

vi.mock('@/lib/redis', () => ({
  getRedis: async () => redisStub,
  resetRedisForTests: async () => redisStub.flushall(),
}))

vi.mock('@/lib/prisma', () => {
  const findUnique = vi.fn(async ({ where: { id } }: any) => promptStore.get(id) ?? null)
  const update = vi.fn(async ({ where: { id }, data, select }: any) => {
    const existing = promptStore.get(id)
    if (!existing) throw new Error('Prompt not found')
    if (data?.views?.increment) {
      existing.views += data.views.increment
    }
    return select ? { id: existing.id, views: existing.views } : existing
  })
  const createViewEvent = vi.fn(async ({ data }: any) => {
    promptViewEvents.push(data)
    return data
  })
  const createAlert = vi.fn(async ({ data }: any) => {
    antifraudAlerts.push(data)
    return data
  })
  return {
    prisma: {
      prompt: { findUnique, update },
      promptViewEvent: { create: createViewEvent },
      viewMonitoringAlert: { create: createAlert },
      $queryRaw: vi.fn(),
    } as unknown as PrismaClient,
  }
})

const authMock = vi.fn(async () => ({ user: { id: 'viewer-user' } }))

vi.mock('@/lib/auth', () => ({
  auth: () => authMock(),
}))

const { computeIpHash, computeUaHash, normalizeFingerprint, buildViewTokenValue, VIEW_TOKEN_TTL_SECONDS } = await import('@/lib/promptViewService')
const { POST: trackViewHandler } = await import('@/app/api/track-view/route')

const mintViewToken = async ({ promptId, userId, ip, userAgent, fingerprint }: { promptId: string; userId?: string | null; ip?: string | null; userAgent?: string | null; fingerprint?: string | null }) => {
  const tokenId = crypto.randomUUID()
  const meta: ViewTokenMeta = {
    promptId,
    userId: userId ?? null,
    ipHash: ip ? computeIpHash(ip) : null,
    uaHash: userAgent ? computeUaHash(userAgent) : null,
    fpHash: normalizeFingerprint(fingerprint ?? null),
    issuedAt: Date.now(),
  }
  await redisStub.set(`viewtoken:${tokenId}`, JSON.stringify(meta), 'EX', VIEW_TOKEN_TTL_SECONDS)
  return { token: buildViewTokenValue(tokenId), meta }
}

beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.VIEW_SALT = 'integration-salt'
})

beforeEach(() => {
  promptStore.clear()
  promptViewEvents.length = 0
  antifraudAlerts.length = 0
  promptStore.set('prompt-track', { id: 'prompt-track', authorId: 'author-1', views: 0 })
  authMock.mockClear()
  authMock.mockResolvedValue({ user: { id: 'viewer-user' } })
})

afterEach(async () => {
  authMock.mockClear()
  authMock.mockResolvedValue({ user: { id: 'viewer-user' } })
  antifraudAlerts.length = 0
  await redisStub.flushall()
})

const buildRequest = (url: string, init: RequestInit & { headers?: Record<string, string> }) => {
  const headers = new Headers(init.headers)
  if (!headers.has('accept-language')) {
    headers.set('accept-language', 'en-US,en;q=0.9')
  }
  if (!headers.has('user-agent')) {
    headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
  }
  return new Request(url, { ...(init ?? {}), headers })
}

describe('view tracking route integration', () => {
  test('counts first view and deduplicates repeated token usage', async () => {
    const minted = await mintViewToken({
      promptId: 'prompt-track',
      userId: 'viewer-user',
      ip: '203.0.113.20',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    })
    expect(minted.token).toBeTruthy()

    const trackRequest = buildRequest('http://localhost/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'x-forwarded-for': '203.0.113.20' },
      body: JSON.stringify({ cardId: 'prompt-track', viewToken: minted.token }),
    })

    const trackResponse = await trackViewHandler(trackRequest)
    const trackPayload = await trackResponse.json()
    expect(trackResponse.status).toBe(200)
    expect(trackPayload).toMatchObject({ counted: true, views: 1 })
    expect(promptStore.get('prompt-track')?.views).toBe(1)

    const duplicateRequest = buildRequest('http://localhost/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'x-forwarded-for': '203.0.113.20' },
      body: JSON.stringify({ cardId: 'prompt-track', viewToken: minted.token }),
    })

    const duplicateResponse = await trackViewHandler(duplicateRequest)
    const duplicatePayload = await duplicateResponse.json()
    expect(duplicateResponse.status).toBe(400)
    expect(duplicatePayload.counted).toBe(false)
    expect(duplicatePayload.reason).toBe('NOT_FOUND')
    expect(promptStore.get('prompt-track')?.views).toBe(1)
  })

  test('guest refresh is blocked even with fingerprint rotation', async () => {
    authMock.mockResolvedValue(null)

    const issueHeaders = { 'Content-Type': 'application/json', 'user-agent': 'GuestUA/1.0', 'x-forwarded-for': '198.51.100.10', 'accept-language': 'en-US,en;q=0.9' }

    const firstMinted = await mintViewToken({
      promptId: 'prompt-track',
      userId: null,
      ip: '198.51.100.10',
      userAgent: 'GuestUA/1.0',
      fingerprint: 'fingerprint-one',
    })

    const trackRequest = buildRequest('http://localhost/api/track-view', {
      method: 'POST',
      headers: issueHeaders,
      body: JSON.stringify({ cardId: 'prompt-track', viewToken: firstMinted.token }),
    })
    const trackResponse = await trackViewHandler(trackRequest)
    const trackPayload = await trackResponse.json()
    expect(trackPayload.counted).toBe(true)
    expect(promptStore.get('prompt-track')?.views).toBe(1)

    const secondMinted = await mintViewToken({
      promptId: 'prompt-track',
      userId: null,
      ip: '198.51.100.10',
      userAgent: 'GuestUA/1.0',
      fingerprint: 'fingerprint-two',
    })

    const secondTrackRequest = buildRequest('http://localhost/api/track-view', {
      method: 'POST',
      headers: issueHeaders,
      body: JSON.stringify({ cardId: 'prompt-track', viewToken: secondMinted.token }),
    })
    const secondTrackResponse = await trackViewHandler(secondTrackRequest)
    const secondTrackPayload = await secondTrackResponse.json()
    expect(secondTrackPayload.counted).toBe(false)
    expect(secondTrackPayload.reason).toBe('RL_GUEST_IPUA')
    expect(promptStore.get('prompt-track')?.views).toBe(1)
  })

  test('blocks bot-like user agents via antifraud', async () => {
    authMock.mockResolvedValue(null)

    const headers = {
      'Content-Type': 'application/json',
      'user-agent': 'HeadlessChrome/123.0',
      'x-forwarded-for': '203.0.113.44',
      'accept-language': 'en-US,en;q=0.9',
    }

    const minted = await mintViewToken({
      promptId: 'prompt-track',
      userId: null,
      ip: '203.0.113.44',
      userAgent: 'HeadlessChrome/123.0',
      fingerprint: 'bot-fprint',
    })

    const trackRequest = buildRequest('http://localhost/api/track-view', {
      method: 'POST',
      headers,
      body: JSON.stringify({ cardId: 'prompt-track', viewToken: minted.token }),
    })

    const trackResponse = await trackViewHandler(trackRequest)
    expect(trackResponse.status).toBe(202)
    const payload = await trackResponse.json()
    expect(payload.counted).toBe(false)
    expect(payload.reason).toBe('BOT_USER_AGENT')
    expect(promptStore.get('prompt-track')?.views).toBe(0)
    expect(promptViewEvents[promptViewEvents.length - 1]?.reason).toBe('BOT_USER_AGENT')  })

  test('does not count author self views', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'author-1' } })

    const minted = await mintViewToken({
      promptId: 'prompt-track',
      userId: 'author-1',
      ip: '198.51.100.5',
      userAgent: 'Vitest/2.0',
    })

    authMock.mockResolvedValueOnce({ user: { id: 'author-1' } })

    const trackRequest = buildRequest('http://localhost/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'user-agent': 'Vitest/2.0', 'x-forwarded-for': '198.51.100.5' },
      body: JSON.stringify({ cardId: 'prompt-track', viewToken: minted.token }),
    })

    const trackResponse = await trackViewHandler(trackRequest)
    const payload = await trackResponse.json()
    expect(trackResponse.status).toBe(200)
    expect(payload.counted).toBe(false)
    expect(payload.reason).toBe('SELF_VIEW')
    expect(promptStore.get('prompt-track')?.views).toBe(0)
  })
})






