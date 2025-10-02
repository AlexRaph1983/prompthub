import { 
  getSearchMetrics, 
  getRejectionStats, 
  resetSearchMetrics 
} from '@/lib/search-metrics'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn()
  }
}))

import { prisma } from '@/lib/prisma'

describe('Search Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSearchMetrics', () => {
    it('should return default metrics when no data exists', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([])

      const metrics = await getSearchMetrics()

      expect(metrics).toEqual({
        countSaved: 0,
        countRejected: 0,
        rejectionReasons: {},
        lastUpdated: expect.any(Date)
      })
    })

    it('should return actual metrics when data exists', async () => {
      const mockData = [{
        count_saved: 100,
        count_rejected: 50,
        rejection_reasons: '{"TOO_SHORT": 30, "INSUFFICIENT_LETTERS": 20}',
        last_updated: '2024-01-01T00:00:00Z'
      }]

      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue(mockData)

      const metrics = await getSearchMetrics()

      expect(metrics).toEqual({
        countSaved: 100,
        countRejected: 50,
        rejectionReasons: {
          'TOO_SHORT': 30,
          'INSUFFICIENT_LETTERS': 20
        },
        lastUpdated: new Date('2024-01-01T00:00:00Z')
      })
    })

    it('should handle invalid JSON in rejection_reasons', async () => {
      const mockData = [{
        count_saved: 100,
        count_rejected: 50,
        rejection_reasons: 'invalid json',
        last_updated: '2024-01-01T00:00:00Z'
      }]

      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue(mockData)

      const metrics = await getSearchMetrics()

      expect(metrics.rejectionReasons).toEqual({})
    })
  })

  describe('getRejectionStats', () => {
    it('should return empty array when no rejections', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([])

      const stats = await getRejectionStats()

      expect(stats).toEqual([])
    })

    it('should return rejection stats sorted by count', async () => {
      const mockData = [{
        count_saved: 100,
        count_rejected: 50,
        rejection_reasons: '{"TOO_SHORT": 30, "INSUFFICIENT_LETTERS": 20}',
        last_updated: '2024-01-01T00:00:00Z'
      }]

      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue(mockData)

      const stats = await getRejectionStats()

      expect(stats).toHaveLength(2)
      expect(stats[0].reason).toBe('TOO_SHORT')
      expect(stats[0].count).toBe(30)
      expect(stats[0].percentage).toBe(60) // 30/50 * 100
      expect(stats[1].reason).toBe('INSUFFICIENT_LETTERS')
      expect(stats[1].count).toBe(20)
      expect(stats[1].percentage).toBe(40) // 20/50 * 100
    })
  })

  describe('resetSearchMetrics', () => {
    it('should delete metrics record', async () => {
      ;(prisma.$executeRaw as jest.Mock).mockResolvedValue({})

      await resetSearchMetrics()

      expect(prisma.$executeRaw).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM SearchMetrics')
      )
    })
  })
})
