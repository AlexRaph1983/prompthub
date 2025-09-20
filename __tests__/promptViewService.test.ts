/** @vitest-environment node */
import { beforeAll, afterEach, describe, expect, test } from 'vitest'
import {
  issueViewToken,
  readViewToken,
  parseViewToken,
  markDuplicateDedupKey,
  applyRateLimit,
  ensureCanIssueViewToken,
  computeIpHash,
  computeUaHash,
  TOKEN_ISSUE_AUTH_LIMIT,
  TOKEN_ISSUE_GUEST_LIMIT,
  ViewTokenMeta,
} from '@/lib/promptViewService'
import { resetRedisForTests } from '@/lib/redis'

beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.VIEW_SALT = 'unit-test-salt'
})

afterEach(async () => {
  await resetRedisForTests()
})

describe('promptViewService token lifecycle', () => {
  test('issues and reads token metadata', async () => {
    const issued = await issueViewToken({
      promptId: 'prompt-1',
      userId: 'user-1',
      ip: '192.168.1.10',
      userAgent: 'Mozilla/5.0',
    })

    expect(issued.token).toBeTruthy()
    const read = await readViewToken(issued.token)
    expect(read.success).toBe(true)
    if (!read.success) throw new Error('token read failed')

    expect(read.meta.promptId).toBe('prompt-1')
    expect(read.meta.userId).toBe('user-1')
    expect(read.meta.ipHash).toBe(computeIpHash('192.168.1.10'))
    expect(read.meta.uaHash).toBe(computeUaHash('Mozilla/5.0'))
  })

  test('rejects tampered token signature', async () => {
    const issued = await issueViewToken({ promptId: 'prompt-2' })
    const malformed = issued.token.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'))
    const result = await readViewToken(malformed)
    expect(result.success).toBe(false)
  })
})

describe('promptViewService antifraud primitives', () => {
  const makeBaseMeta = (): ViewTokenMeta => ({
    promptId: 'prompt-3',
    userId: 'user-42',
    ipHash: computeIpHash('10.0.0.1'),
    uaHash: computeUaHash('TestUA'),
    fpHash: null,
    issuedAt: Date.now(),
  })

  test('duplicate guard allows first write and blocks subsequent ones', async () => {
    const issued = await issueViewToken({ promptId: 'prompt-dup' })
    const read = await readViewToken(issued.token)
    if (!read.success) throw new Error('token read failed')

    const first = await markDuplicateDedupKey(read.tokenId)
    const second = await markDuplicateDedupKey(read.tokenId)
    expect(first).toBe(true)
    expect(second).toBe(false)
  })

  test('authenticated rate limit enforces 8h window', async () => {
    const meta = makeBaseMeta()
    const allow = await applyRateLimit(meta)
    const block = await applyRateLimit(meta)
    expect(allow).toMatchObject({ allowed: true })
    expect(block).toMatchObject({ allowed: false, reason: 'RL_AUTH' })
  })

  test('guest rate limit falls back to ip/ua when fingerprint missing', async () => {
    const guestMeta: ViewTokenMeta = { ...makeBaseMeta(), userId: null }
    const first = await applyRateLimit(guestMeta)
    const second = await applyRateLimit(guestMeta)
    expect(first.allowed).toBe(true)
    expect(second).toMatchObject({ allowed: false, reason: 'RL_GUEST_IPUA' })
  })
  test('guest rate limit locks on fingerprint reuse', async () => {
    const meta: ViewTokenMeta = {
      promptId: 'prompt-guest-fp',
      userId: null,
      ipHash: null,
      uaHash: null,
      fpHash: 'fp-hash-1',
      issuedAt: Date.now(),
    }
    const first = await applyRateLimit(meta)
    const second = await applyRateLimit(meta)
    expect(first.allowed).toBe(true)
    expect(second).toMatchObject({ allowed: false, reason: 'RL_GUEST_FP' })
  })

  test('guest cannot bypass limit by rotating fingerprint with same ip', async () => {
    const base: ViewTokenMeta = {
      promptId: 'prompt-guest-rotate',
      userId: null,
      ipHash: computeIpHash('172.16.0.9'),
      uaHash: computeUaHash('RotateUA'),
      fpHash: 'finger-1',
      issuedAt: Date.now(),
    }
    const first = await applyRateLimit(base)
    const second = await applyRateLimit({ ...base, fpHash: 'finger-2', issuedAt: Date.now() })
    expect(first.allowed).toBe(true)
    expect(second).toMatchObject({ allowed: false, reason: 'RL_GUEST_IPUA' })
  })

  test('token issue guard limits guest bursts', async () => {
    for (let i = 0; i < TOKEN_ISSUE_GUEST_LIMIT; i++) {
      const result = await ensureCanIssueViewToken({ userId: null, ip: '198.51.100.33', userAgent: 'RateTester/1.0', fingerprint: null })
      expect(result.allowed).toBe(true)
    }
    const blocked = await ensureCanIssueViewToken({ userId: null, ip: '198.51.100.33', userAgent: 'RateTester/1.0', fingerprint: null })
    expect(blocked.allowed).toBe(false)
    expect(blocked.reason).toBe('ISSUE_RL_GUEST')
  })

  test('token issue guard limits authenticated bursts', async () => {
    for (let i = 0; i < TOKEN_ISSUE_AUTH_LIMIT; i++) {
      const result = await ensureCanIssueViewToken({ userId: 'auth-user', ip: '203.0.113.50', userAgent: 'AuthTester/1.0', fingerprint: null })
      expect(result.allowed).toBe(true)
    }
    const blocked = await ensureCanIssueViewToken({ userId: 'auth-user', ip: '203.0.113.50', userAgent: 'AuthTester/1.0', fingerprint: null })
    expect(blocked.allowed).toBe(false)
    expect(blocked.reason).toBe('ISSUE_RL_AUTH')
  })

})
