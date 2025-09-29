import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Простая версия API без авторизации для тестирования
    console.log('🔍 Simple dashboard API called')

    // Получаем статистику
    const totalUsers = await prisma.user.count()
    const totalPrompts = await prisma.prompt.count()
    // Получаем все id промптов
    const allPromptIds = await prisma.prompt.findMany({ select: { id: true } })
    const promptIds = allPromptIds.map(p => p.id)
    // Получаем просмотры через ViewsService
    const { ViewsService } = await import('@/lib/services/viewsService')
    const viewsMap = await ViewsService.getPromptsViews(promptIds)
    const totalViews = Array.from(viewsMap.values()).reduce((sum, v) => sum + v, 0)
    const totalSearches = await prisma.searchQuery.count()

    const stats = {
      users: totalUsers,
      prompts: totalPrompts,
      views: totalViews,
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
