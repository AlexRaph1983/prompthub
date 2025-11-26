import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Search analytics API called')
    
    // Временно отключаем авторизацию для тестирования
    // const adminSession = await requirePermission('analytics_view', request)
    // if (!adminSession) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 1000)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10)
    const skip = (page - 1) * pageSize
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`📊 Fetching analytics for ${days} days, page ${page}, pageSize ${pageSize}`)

    // Получаем топ поисковых запросов
    const topQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        query: true
      },
      _avg: {
        resultsCount: true
      },
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: limit
    })

    // Получаем статистику по дням
    const dailyStats = await prisma.$queryRaw<Array<{
      date: string
      total_searches: bigint
      unique_users: bigint
      avg_results: number
    }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as total_searches,
        COUNT(DISTINCT COALESCE(userId, ipHash)) as unique_users,
        AVG(CAST(resultsCount as FLOAT)) as avg_results
      FROM SearchQuery 
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 100
    `

    // Получаем запросы с нулевыми результатами
    const zeroResultQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: startDate
        },
        resultsCount: 0
      },
      _count: {
        query: true
      },
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: 50
    })

    // Получаем общее количество запросов для пагинации
    const totalQueriesCount = await prisma.searchQuery.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })

    // Получаем последние поисковые запросы с пагинацией
    const recentQueries = await prisma.searchQuery.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        query: true,
        userId: true,
        resultsCount: true,
        clickedResult: true,
        createdAt: true,
        userAgent: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: pageSize
    })

    // Общая статистика
    const totalStats = await prisma.searchQuery.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        resultsCount: true
      }
    })

    const uniqueUsers = await prisma.searchQuery.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        userId: true,
        ipHash: true
      },
      distinct: ['userId', 'ipHash']
    })

    const result = {
      summary: {
        totalSearches: Number(totalStats._count.id),
        uniqueUsers: uniqueUsers.length,
        averageResults: Number(totalStats._avg.resultsCount?.toFixed(2) || 0),
        period: `${days} days`,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      topQueries: topQueries.map(q => ({
        query: q.query,
        count: q._count.query,
        averageResults: Number(q._avg.resultsCount?.toFixed(2) || 0)
      })),
      dailyStats: dailyStats.map(d => ({
        date: d.date,
        totalSearches: Number(d.total_searches),
        uniqueUsers: Number(d.unique_users),
        averageResults: Number(d.avg_results?.toFixed(2) || 0)
      })),
      zeroResultQueries: zeroResultQueries.map(q => ({
        query: q.query,
        count: q._count.query
      })),
      recentQueries: recentQueries.map(q => ({
        id: q.id,
        query: q.query,
        userId: q.userId,
        resultsCount: q.resultsCount,
        hasClick: !!q.clickedResult,
        createdAt: q.createdAt,
        userAgent: q.userAgent?.substring(0, 100) // Обрезаем для безопасности
      })),
      pagination: {
        page,
        pageSize,
        total: totalQueriesCount,
        totalPages: Math.ceil(totalQueriesCount / pageSize)
      }
    }

    console.log('📊 Analytics result:', {
      totalSearches: result.summary.totalSearches,
      uniqueUsers: result.summary.uniqueUsers,
      topQueriesCount: result.topQueries.length
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error fetching search analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}