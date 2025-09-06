import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: {
  prompt: { findUnique: vi.fn() },
  rating: {
    upsert: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    findUnique: vi.fn(),
  },
  like: { count: vi.fn() },
  save: { count: vi.fn() },
  comment: { count: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
} }))
vi.mock('@/lib/reputationService', () => ({ updateUserReputation: vi.fn().mockResolvedValue({ score0to100: 80 }) }))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserReputation } from '@/lib/reputationService'
import { GET, POST } from '@/app/api/ratings/route'

function makeRequest(body: any) {
  return new Request('http://localhost/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('POST /api/ratings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('requires auth', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res: any = await POST(makeRequest({ promptId: 'p1', value: 5 }))
    expect(res.status).toBe(401)
  })

  it('validates payload', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
    const res: any = await POST(makeRequest({ promptId: 'p1', value: 6 }))
    expect(res.status).toBe(400)
  })

  it('creates rating once and returns aggregates', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' })
    ;(prisma.prompt.findUnique as any).mockResolvedValue({ id: 'p1', authorId: 'u2' })
    ;(prisma.rating.findUnique as any).mockResolvedValueOnce(null).mockResolvedValue({ value: 5 })
    ;(prisma.rating.create as any).mockResolvedValue({})
    ;(prisma.rating.count as any).mockResolvedValue(3)
    ;(prisma.rating.aggregate as any).mockResolvedValue({ _avg: { value: 4.3333 } })

    const res: any = await POST(makeRequest({ promptId: 'p1', value: 5 }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.average).toBe(4.3)
    expect(json.count).toBe(3)
    expect(json.myRating).toBe(5)
  })

  it('forbids author to rate own prompt', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: 'u1' })
    ;(prisma.prompt.findUnique as any).mockResolvedValue({ id: 'p1', authorId: 'u1' })
    const res: any = await POST(makeRequest({ promptId: 'p1', value: 5 }))
    expect(res.status).toBe(403)
  })
})

describe('GET /api/ratings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  function makeGet(url: string) {
    return new Request(url) as any
  }

  it('returns aggregates and disallows rating when already rated', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.prompt.findUnique as any).mockResolvedValue({ authorId: 'u2' })
    ;(prisma.rating.count as any).mockResolvedValue(2)
    ;(prisma.rating.aggregate as any).mockResolvedValue({ _avg: { value: 4 } })
    ;(prisma.rating.findUnique as any).mockResolvedValue({ value: 5 })

    const res: any = await GET(makeGet('http://localhost/api/ratings?promptId=p1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.average).toBe(4)
    expect(json.count).toBe(2)
    expect(json.myRating).toBe(5)
    expect(json.canRate).toBe(false)
  })

  it('disables rating for own prompt', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.prompt.findUnique as any).mockResolvedValue({ authorId: 'u1' })
    ;(prisma.rating.count as any).mockResolvedValue(0)
    ;(prisma.rating.aggregate as any).mockResolvedValue({ _avg: { value: null } })
    ;(prisma.rating.findUnique as any).mockResolvedValue(null)

    const res: any = await GET(makeGet('http://localhost/api/ratings?promptId=p1'))
    const json = await res.json()
    expect(json.canRate).toBe(false)
  })
})


