import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // === ЕЖЕДНЕВНАЯ СТАТИСТИКА ПРОСМОТРОВ И КОПИРОВАНИЙ (за 30 дней) ===
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Получаем ежедневные просмотры из PromptViewEvent
    const dailyViewsRaw = await prisma.promptViewEvent.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        isCounted: true
      },
      _count: { id: true }
    })

    // Получаем ежедневные копирования из PromptInteraction
    const dailyCopiesRaw = await prisma.promptInteraction.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        type: 'copy'
      },
      _count: { id: true }
    })

    // Агрегируем по дате (день)
    const viewsByDate: Record<string, number> = {}
    dailyViewsRaw.forEach((item) => {
      const dateKey = item.createdAt.toISOString().slice(0, 10)
      viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + item._count.id
    })

    const copiesByDate: Record<string, number> = {}
    dailyCopiesRaw.forEach((item) => {
      const dateKey = item.createdAt.toISOString().slice(0, 10)
      copiesByDate[dateKey] = (copiesByDate[dateKey] || 0) + item._count.id
    })

    // Создаём массив дней за последние 30 дней
    const dailyStats: Array<{
      date: string
      views: number
      copies: number
      cumulativeViews: number
      cumulativeCopies: number
    }> = []

    let cumulativeViews = 0
    let cumulativeCopies = 0

    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().slice(0, 10)
      
      const dayViews = viewsByDate[dateKey] || 0
      const dayCopies = copiesByDate[dateKey] || 0
      
      cumulativeViews += dayViews
      cumulativeCopies += dayCopies
      
      dailyStats.push({
        date: dateKey,
        views: dayViews,
        copies: dayCopies,
        cumulativeViews,
        cumulativeCopies
      })
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
      dailyStats
    }

    console.log('📊 Dashboard stats:', stats)

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