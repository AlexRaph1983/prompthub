import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type DailyStat = {
  date: string
  views: number
  copies: number
  cumulativeViews: number
  cumulativeCopies: number
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin dashboard API called')
    
    // Временно отключаем авторизацию для тестирования
    // const adminSession = await requirePermission('analytics_view', request)
    // if (!adminSession) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Получаем статистику
    const totalUsers = await prisma.user.count()
    const totalPrompts = await prisma.prompt.count()
    const totalViews = await prisma.prompt.aggregate({
      _sum: {
        views: true
      }
    })
    const totalSearches = await prisma.searchQuery.count()
    
    // Общее число копирований
    const totalCopies = await prisma.promptInteraction.count({
      where: { type: 'copy' }
    })

    // Получаем последние промпты
    const recentPrompts = await prisma.prompt.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Получаем последние пользователи
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    // === ЕЖЕДНЕВНАЯ СТАТИСТИКА ПРОСМОТРОВ И КОПИРОВАНИЙ (ALL-TIME + ПОСЛЕДНИЙ МЕСЯЦ) ===

    // Получаем все просмотры (без ограничения по дате), агрегируем по дню
    const allViewsRaw = await prisma.promptViewEvent.groupBy({
      by: ['createdAt'],
      where: {
        isCounted: true
      },
      _count: { id: true }
    })

    const allCopiesRaw = await prisma.promptInteraction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'copy'
      },
      _count: { id: true }
    })

    const viewsByDateAll: Record<string, number> = {}
    allViewsRaw.forEach((item) => {
      const dateKey = item.createdAt.toISOString().slice(0, 10)
      viewsByDateAll[dateKey] = (viewsByDateAll[dateKey] || 0) + item._count.id
    })

    const copiesByDateAll: Record<string, number> = {}
    allCopiesRaw.forEach((item) => {
      const dateKey = item.createdAt.toISOString().slice(0, 10)
      copiesByDateAll[dateKey] = (copiesByDateAll[dateKey] || 0) + item._count.id
    })

    const allDateKeys = Array.from(
      new Set([...Object.keys(viewsByDateAll), ...Object.keys(copiesByDateAll)])
    ).sort()

    const allTimeDailyStats: DailyStat[] = []

    if (allDateKeys.length > 0) {
      const startDate = new Date(allDateKeys[0])
      startDate.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let cumulativeViews = 0
      let cumulativeCopies = 0

      for (
        const d = new Date(startDate);
        d <= today;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().slice(0, 10)

        const dayViews = viewsByDateAll[dateKey] || 0
        const dayCopies = copiesByDateAll[dateKey] || 0

        cumulativeViews += dayViews
        cumulativeCopies += dayCopies

        allTimeDailyStats.push({
          date: dateKey,
          views: dayViews,
          copies: dayCopies,
          cumulativeViews,
          cumulativeCopies
        })
      }
    }

    // Последние 30 дней как срез all-time (для уникальности источника правды)
    const WINDOW_DAYS = 30
    let last30DaysStats: DailyStat[] = []
    let monthlyBaselineViews = 0
    let monthlyBaselineCopies = 0

    if (allTimeDailyStats.length > 0) {
      const totalDays = allTimeDailyStats.length

      if (totalDays <= WINDOW_DAYS) {
        // Данных меньше месяца — просто используем всё без baseline
        last30DaysStats = [...allTimeDailyStats]
      } else {
        last30DaysStats = allTimeDailyStats.slice(-WINDOW_DAYS)

        const baselineIndex = totalDays - WINDOW_DAYS - 1
        if (baselineIndex >= 0) {
          const baselineDay = allTimeDailyStats[baselineIndex]
          monthlyBaselineViews = baselineDay.cumulativeViews
          monthlyBaselineCopies = baselineDay.cumulativeCopies
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
      // Обратная совместимость: dailyStats остаётся «последние 30 дней»
      dailyStats: last30DaysStats,
      // Новые поля для более продвинутых графиков
      dailyStatsAllTime: allTimeDailyStats,
      monthlyBaseline: {
        views: monthlyBaselineViews,
        copies: monthlyBaselineCopies
      }
    }

    console.log('📊 Dashboard stats:', {
      ...stats,
      dailyStatsLength: stats.dailyStats.length,
      dailyStatsAllTimeLength: stats.dailyStatsAllTime.length
    })

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('❌ Error in admin dashboard API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}