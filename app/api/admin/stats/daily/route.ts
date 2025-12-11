import { NextRequest, NextResponse } from 'next/server'
import { getDailySeries, StatRange } from '@/lib/services/dailyStatsService'

function normalizeRange(value: string | null): StatRange {
  if (value === 'last7') return 'last7'
  if (value === 'all') return 'all'
  return 'month'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = normalizeRange(searchParams.get('range'))

    const result = await getDailySeries(range)
    const series = result.series

    const labels = series.map((d) => d.date)
    const views = series.map((d) => d.views)
    const copies = series.map((d) => d.copies)

    return NextResponse.json({
      success: true,
      data: {
        range,
        labels,
        views,
        copies,
        series,
        lastUpdated: result.lastUpdated
      }
    })
  } catch (error) {
    console.error('[admin-stats:daily] failed', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch daily stats'
      },
      { status: 500 }
    )
  }
}

