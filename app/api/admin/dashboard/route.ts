import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const adminSession = await requirePermission('analytics_view', request)
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Основная статистика
    const [
      totalUsers,
      totalPrompts,
      totalViews,
      totalSearches,
      // Статистика за сегодня
      todayUsers,
      todayPrompts,
      todayViews,
      todaySearches,
      // Статистика за неделю
      weekUsers,
      weekPrompts,
      weekViews,
      weekSearches,
      // Топ промпты
      topPrompts,
      // Последние промпты
      recentPrompts,
      // Статистика по категориям
      categoryStats
    ] = await Promise.all([
      // Общая статистика
      prisma.user.count(),
      prisma.prompt.count(),
      prisma.prompt.aggregate({ _sum: { views: true } }),
      prisma.searchQuery.count(),
      
      // За сегодня
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.prompt.count({ where: { createdAt: { gte: today } } }),
      prisma.promptViewEvent.count({ where: { createdAt: { gte: today }, isCounted: true } }),
      prisma.searchQuery.count({ where: { createdAt: { gte: today } } }),
      
      // За неделю
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.prompt.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.promptViewEvent.count({ where: { createdAt: { gte: weekAgo }, isCounted: true } }),
      prisma.searchQuery.count({ where: { createdAt: { gte: weekAgo } } }),
      
      // Топ промпты по просмотрам
      prisma.prompt.findMany({
        select: {
          id: true,
          title: true,
          views: true,
          averageRating: true,
          totalRatings: true,
          createdAt: true,
          author: {
            select: { name: true, email: true }
          }
        },
        orderBy: { views: 'desc' },
        take: 10
      }),
      
      // Последние промпты
      prisma.prompt.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          views: true,
          averageRating: true,
          createdAt: true,
          author: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Статистика по категориям
      prisma.prompt.groupBy({
        by: ['category'],
        _count: { category: true },
        _avg: { views: true, averageRating: true },
        orderBy: { _count: { category: 'desc' } }
      })
    ])

    // Получаем данные о росте пользователей по дням за последние 30 дней
    const userGrowth = await prisma.$queryRaw<Array<{
      date: string
      new_users: bigint
      cumulative_users: bigint
    }>>`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-29 days')
        UNION ALL
        SELECT date(date, '+1 day')
        FROM dates
        WHERE date < date('now')
      ),
      daily_users AS (
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as new_users
        FROM User
        WHERE createdAt >= date('now', '-29 days')
        GROUP BY DATE(createdAt)
      )
      SELECT 
        dates.date,
        COALESCE(daily_users.new_users, 0) as new_users,
        (
          SELECT COUNT(*) 
          FROM User 
          WHERE DATE(createdAt) <= dates.date
        ) as cumulative_users
      FROM dates
      LEFT JOIN daily_users ON dates.date = daily_users.date
      ORDER BY dates.date
    `

    // Топ поисковые запросы за неделю
    const topSearchQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: { createdAt: { gte: weekAgo } },
      _count: { query: true },
      _avg: { resultsCount: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPrompts,
        totalViews: totalViews._sum.views || 0,
        totalSearches,
        
        today: {
          users: todayUsers,
          prompts: todayPrompts,
          views: todayViews,
          searches: todaySearches
        },
        
        week: {
          users: weekUsers,
          prompts: weekPrompts,
          views: weekViews,
          searches: weekSearches
        }
      },
      
      charts: {
        userGrowth: userGrowth.map(row => ({
          date: row.date,
          newUsers: Number(row.new_users),
          cumulativeUsers: Number(row.cumulative_users)
        })),
        
        categoryStats: categoryStats.map(cat => ({
          category: cat.category,
          count: cat._count.category,
          averageViews: Number(cat._avg.views?.toFixed(1) || 0),
          averageRating: Number(cat._avg.averageRating?.toFixed(2) || 0)
        }))
      },
      
      topContent: {
        prompts: topPrompts.map(prompt => ({
          id: prompt.id,
          title: prompt.title,
          views: prompt.views,
          rating: Number(prompt.averageRating.toFixed(2)),
          ratingsCount: prompt.totalRatings,
          author: prompt.author.name || prompt.author.email,
          createdAt: prompt.createdAt
        })),
        
        searchQueries: topSearchQueries.map(query => ({
          query: query.query,
          count: query._count.query,
          averageResults: Number(query._avg.resultsCount?.toFixed(1) || 0)
        }))
      },
      
      recentActivity: {
        prompts: recentPrompts.map(prompt => ({
          id: prompt.id,
          title: prompt.title,
          description: prompt.description.substring(0, 100) + '...',
          views: prompt.views,
          rating: Number(prompt.averageRating.toFixed(2)),
          author: prompt.author.name || prompt.author.email,
          createdAt: prompt.createdAt
        }))
      },
      
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
