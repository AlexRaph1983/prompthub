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
      searches: totalSearches
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