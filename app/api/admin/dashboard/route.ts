import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { statisticsAggregator } from '@/lib/services/statisticsAggregator'

type DailyStat = {
  date: string
  views: number
  copies: number
  cumulativeViews: number
  cumulativeCopies: number
}

async function buildDashboardStats(logPrefix: string) {
  const totalUsers = await prisma.user.count()
  const totalPrompts = await prisma.prompt.count()
  const totalViews = await prisma.prompt.aggregate({
    _sum: { views: true }
  })
  const totalSearches = await prisma.searchQuery.count()
  const totalCopies = await prisma.promptInteraction.count({
    where: { type: 'copy' }
  })

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

  const allTimeDailyStats = await statisticsAggregator.getAllTimeSeries({
    includeTodaySnapshot: true,
    logPrefix
  })

  // Рабочее окно: последние 7 дней
  const WINDOW_DAYS = 7
  let lastWindowStats: DailyStat[] = []
  let windowBaselineViews = 0
  let windowBaselineCopies = 0

  if (allTimeDailyStats.length > 0) {
    const totalDays = allTimeDailyStats.length

    if (totalDays <= WINDOW_DAYS) {
      lastWindowStats = [...allTimeDailyStats]
    } else {
      lastWindowStats = allTimeDailyStats.slice(-WINDOW_DAYS)

      const baselineIndex = totalDays - WINDOW_DAYS - 1
      if (baselineIndex >= 0) {
        const baselineDay = allTimeDailyStats[baselineIndex]
        windowBaselineViews = baselineDay.cumulativeViews
        windowBaselineCopies = baselineDay.cumulativeCopies
      }
    }
  }

  const stats = {
    users: {
      total: totalUsers,
      recent: recentUsers
    },
    prompts: {
      total: totalPrompts,
      recent: recentPrompts
    },
    views: totalViews._sum.views || 0,
    searches: totalSearches,
    copies: totalCopies,
    dailyStats: lastWindowStats,
    dailyStatsAllTime: allTimeDailyStats,
    windowBaseline: {
      views: windowBaselineViews,
      copies: windowBaselineCopies
    }
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
    const stats = await buildDashboardStats('[admin-dashboard]')

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
    await statisticsAggregator.backfillUntilYesterday('[admin-dashboard-refresh]')
    await statisticsAggregator.aggregateDay(new Date(), { logPrefix: '[admin-dashboard-refresh]' })

    const stats = await buildDashboardStats('[admin-dashboard-refresh]')

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('❌ Error refreshing admin dashboard:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}