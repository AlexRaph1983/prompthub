import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDailySeries, rebuildAllDailyStats } from '@/lib/services/dailyStatsService'

type DailyStat = {
  date: string
  views: number
  copies: number
  cumulativeViews: number
  cumulativeCopies: number
}

async function buildDashboardStats() {
  const totalUsers = await prisma.user.count()
  const totalPrompts = await prisma.prompt.count()
  const totalSearches = await prisma.searchQuery.count()

  const recentPrompts = await prisma.prompt.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { name: true, email: true }
      }
    }
  })

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  })

  const [monthStats, allStats, weekStats] = await Promise.all([
    getDailySeries('month'),
    getDailySeries('all'),
    getDailySeries('last7')
  ])

  const totalViews = monthStats.totals.views
  const totalCopies = monthStats.totals.copies

  const lastMonthStats: DailyStat[] = monthStats.series
  const lastWeekStats: DailyStat[] = weekStats.series
  const allTimeDailyStats: DailyStat[] = allStats.series

  const lastUpdatedDate =
    monthStats.lastUpdated ||
    allStats.lastUpdated ||
    null

  const stats = {
    users: {
      total: totalUsers,
      recent: recentUsers
    },
    prompts: {
      total: totalPrompts,
      recent: recentPrompts
    },
    views: totalViews || 0,
    searches: totalSearches,
    copies: totalCopies,
    dailyStats: lastMonthStats,
    dailyStatsLastWeek: lastWeekStats,
    dailyStatsAllTime: allTimeDailyStats,
    windowBaseline: {
      views: monthStats.baseline.views,
      copies: monthStats.baseline.copies
    },
    lastUpdated: lastUpdatedDate ? new Date(lastUpdatedDate).toISOString() : null
  }

  console.log('📊 Dashboard stats:', {
    ...stats,
    dailyStatsLength: stats.dailyStats.length,
    dailyStatsAllTimeLength: stats.dailyStatsAllTime.length
  })

  return stats
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin dashboard API called')

    // TODO: вернуть проверку прав admin
    const stats = await buildDashboardStats()

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('❌ Error in admin dashboard API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    console.log('♻️ Admin dashboard refresh triggered')

    // TODO: вернуть проверку прав admin
    await rebuildAllDailyStats({ includeToday: true })

    const stats = await buildDashboardStats()

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('❌ Error refreshing admin dashboard:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}