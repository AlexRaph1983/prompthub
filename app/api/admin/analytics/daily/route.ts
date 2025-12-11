import { NextRequest, NextResponse } from 'next/server'
import { getDailySeries, StatRange } from '@/lib/services/dailyStatsService'

const normalizeRange = (value: string | null): StatRange => {
  if (value === 'last7') return 'last7'
  if (value === 'all') return 'all'
  return 'month'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = normalizeRange(searchParams.get('range'))

    const result = await getDailySeries(range)
    const labels = result.series.map((d) => d.date)
    const views = result.series.map((d) => d.views)
    const copies = result.series.map((d) => d.copies)

    const last7Slice = result.series.slice(-7)
    const summaryLast7 = last7Slice.reduce(
      (acc, cur) => ({
        views: acc.views + (cur?.views || 0),
        copies: acc.copies + (cur?.copies || 0)
      }),
      { views: 0, copies: 0 }
    )

    return NextResponse.json({
      success: true,
      data: {
        range,
        labels,
        views,
        copies,
        series: result.series,
        baseline: result.baseline,
        totals: result.totals,
        summary: {
          last7Days: summaryLast7,
          total: result.totals
        },
        lastUpdated: result.lastUpdated
      }
    })
  } catch (error) {
    console.error('[admin-analytics:daily] failed', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily analytics' },
      { status: 500 }
    )
  }
}

