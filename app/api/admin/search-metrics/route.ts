import { NextRequest, NextResponse } from 'next/server'
import { getSearchMetrics, getRejectionStats } from '@/lib/search-metrics'

export async function GET(request: NextRequest) {
  try {
    // Временно отключаем авторизацию для тестирования
    // const adminSession = await requirePermission('analytics_view', request)
    // if (!adminSession) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    // Получаем основные метрики
    const metrics = await getSearchMetrics()
    
    let rejectionStats = []
    if (includeStats) {
      rejectionStats = await getRejectionStats()
    }

    // Вычисляем дополнительные метрики
    const totalQueries = metrics.countSaved + metrics.countRejected
    const acceptanceRate = totalQueries > 0 ? Math.round((metrics.countSaved / totalQueries) * 100) : 0
    const rejectionRate = totalQueries > 0 ? Math.round((metrics.countRejected / totalQueries) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          countSaved: metrics.countSaved,
          countRejected: metrics.countRejected,
          totalQueries: totalQueries,
          acceptanceRate,
          rejectionRate,
          lastUpdated: metrics.lastUpdated
        },
        rejectionReasons: metrics.rejectionReasons,
        rejectionStats: includeStats ? rejectionStats : undefined
      }
    })
  } catch (error) {
    console.error('Error fetching search metrics:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      reason: 'SERVER_ERROR'
    }, { status: 500 })
  }
}
