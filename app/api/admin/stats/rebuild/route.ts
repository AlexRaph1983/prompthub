import { NextRequest, NextResponse } from 'next/server'
import { rebuildAllDailyStats } from '@/lib/services/dailyStatsService'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}))
    const includeToday = payload?.includeToday !== false

    const aggregated = await rebuildAllDailyStats({ includeToday })

    const lastUpdatedDate =
      aggregated[aggregated.length - 1]?.updatedAt ||
      aggregated[aggregated.length - 1]?.aggregatedAt ||
      new Date()

    return NextResponse.json({
      success: true,
      data: {
        days: aggregated.length,
        lastUpdated: lastUpdatedDate ? new Date(lastUpdatedDate).toISOString() : null
      }
    })
  } catch (error) {
    console.error('[admin-stats:rebuild] failed', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to rebuild daily stats'
      },
      { status: 500 }
    )
  }
}

