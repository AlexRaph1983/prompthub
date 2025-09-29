import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Простая версия API без авторизации для тестирования
    console.log('🔍 Simple dashboard API called')

    // Получаем статистику
    const totalUsers = await prisma.user.count()
    const totalPrompts = await prisma.prompt.count()
    const totalViews = await prisma.prompt.aggregate({
      _sum: {
        views: true
      }
    })
    const totalSearches = await prisma.searchQuery.count()

    const stats = {
      users: totalUsers,
      prompts: totalPrompts,
      views: totalViews._sum.views || 0,
      searches: totalSearches
    }

    console.log('📊 Stats:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('❌ Error in simple dashboard API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
