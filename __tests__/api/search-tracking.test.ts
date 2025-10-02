import { NextRequest } from 'next/server'
import { POST } from '@/app/api/search-tracking/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    searchQuery: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

describe('/api/search-tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: 'user1' } })
    ;(prisma.searchQuery.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.searchQuery.create as jest.Mock).mockResolvedValue({ id: 'query1' })
  })

  it('should track valid search query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: 'hash123',
        resultsCount: 5,
        sessionId: 'session123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.searchQuery.create).toHaveBeenCalledWith({
      data: {
        query: 'hello world',
        queryHash: 'hash123',
        userId: 'user1',
        ipHash: null,
        userAgent: null,
        resultsCount: 5,
        clickedResult: undefined,
        sessionId: 'session123'
      }
    })
  })

  it('should reject missing query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Query is required')
    expect(data.reason).toBe('MISSING_QUERY')
  })

  it('should reject short query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'ab',
        queryHash: 'hash123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.reason).toBe('INVALID_QUERY')
  })

  it('should reject duplicate query', async () => {
    ;(prisma.searchQuery.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' })

    const request = new NextRequest('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: 'hash123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.reason).toBe('DUPLICATE_QUERY')
  })

  it('should handle anonymous user', async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: 'hash123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.searchQuery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: null,
        ipHash: expect.any(String)
      })
    })
  })
})
