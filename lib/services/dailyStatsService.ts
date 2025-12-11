import { prisma } from '@/lib/prisma'

export type StatRange = 'last7' | 'month' | 'all'

export type DailyStatPoint = {
  date: string
  views: number
  copies: number
  cumulativeViews: number
  cumulativeCopies: number
  updatedAt?: Date
}

const GLOBAL_PROMPT_ID = 'global'

const startOfDayUtc = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addDays = (date: Date, days: number) => {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

const toDateKey = (date: Date) => startOfDayUtc(date).toISOString().slice(0, 10)

async function countEventsForDay(dayStart: Date) {
  const dayEnd = addDays(dayStart, 1)
  const [views, copies] = await Promise.all([
    prisma.promptViewEvent.count({
      where: {
        isCounted: true,
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    }),
    prisma.promptInteraction.count({
      where: {
        type: 'copy',
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    })
  ])

  return { views, copies }
}

async function getEarliestDate() {
  const [stat, firstView, firstCopy] = await Promise.all([
    prisma.promptDailyStats.findFirst({
      where: { promptId: GLOBAL_PROMPT_ID },
      orderBy: { date: 'asc' },
      select: { date: true }
    }),
    prisma.promptViewEvent.findFirst({
      where: { isCounted: true },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    }),
    prisma.promptInteraction.findFirst({
      where: { type: 'copy' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    })
  ])

  const dates: Date[] = []
  if (stat?.date) dates.push(startOfDayUtc(stat.date))
  if (firstView?.createdAt) dates.push(startOfDayUtc(firstView.createdAt))
  if (firstCopy?.createdAt) dates.push(startOfDayUtc(firstCopy.createdAt))

  if (dates.length === 0) return startOfDayUtc(new Date())
  const min = new Date(Math.min(...dates.map((d) => d.getTime())))
  return startOfDayUtc(min)
}

async function ensureRange(start: Date, end: Date) {
  const existing = await prisma.promptDailyStats.findMany({
    where: {
      promptId: GLOBAL_PROMPT_ID,
      date: {
        gte: start,
        lte: end
      }
    },
    select: { date: true }
  })
  const existingKeys = new Set(existing.map((row) => toDateKey(row.date)))

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor = addDays(cursor, 1)
  ) {
    const key = toDateKey(cursor)
    if (existingKeys.has(key)) continue

    const dayStart = startOfDayUtc(cursor)
    const { views, copies } = await countEventsForDay(dayStart)

    await prisma.promptDailyStats.upsert({
      where: {
        date_promptId: { date: dayStart, promptId: GLOBAL_PROMPT_ID }
      },
      create: {
        date: dayStart,
        promptId: GLOBAL_PROMPT_ID,
        views,
        copies
      },
      update: {
        views,
        copies
      }
    })
  }
}

export async function incrementPromptStats({
  promptId,
  type,
  date
}: {
  promptId?: string
  type: 'view' | 'copy'
  date?: Date
}) {
  const day = startOfDayUtc(date ?? new Date())
  await prisma.promptDailyStats.upsert({
    where: { date_promptId: { date: day, promptId: promptId ?? GLOBAL_PROMPT_ID } },
    create: {
      date: day,
      promptId: promptId ?? GLOBAL_PROMPT_ID,
      views: type === 'view' ? 1 : 0,
      copies: type === 'copy' ? 1 : 0
    },
    update: {
      views: { increment: type === 'view' ? 1 : 0 },
      copies: { increment: type === 'copy' ? 1 : 0 }
    }
  })
}

export async function recomputeDayFromEvents(date: Date) {
  const dayStart = startOfDayUtc(date)
  const { views, copies } = await countEventsForDay(dayStart)

  const row = await prisma.promptDailyStats.upsert({
    where: {
      date_promptId: { date: dayStart, promptId: GLOBAL_PROMPT_ID }
    },
    create: {
      date: dayStart,
      promptId: GLOBAL_PROMPT_ID,
      views,
      copies
    },
    update: {
      views,
      copies
    }
  })

  return { views, copies, date: toDateKey(dayStart), updatedAt: row.updatedAt }
}

export async function rebuildAllDailyStats({ includeToday = true }: { includeToday?: boolean } = {}) {
  const earliest = await getEarliestDate()
  const end = includeToday ? startOfDayUtc(new Date()) : addDays(startOfDayUtc(new Date()), -1)

  await prisma.promptDailyStats.deleteMany({ where: { promptId: GLOBAL_PROMPT_ID } })

  const aggregated: DailyStatPoint[] = []
  let cumulativeViews = 0
  let cumulativeCopies = 0

  for (let cursor = earliest; cursor <= end; cursor = addDays(cursor, 1)) {
    const { views, copies, updatedAt } = await recomputeDayFromEvents(cursor)
    cumulativeViews += views
    cumulativeCopies += copies
    aggregated.push({
      date: toDateKey(cursor),
      views,
      copies,
      cumulativeViews,
      cumulativeCopies,
      updatedAt
    })
  }

  return aggregated
}

export async function getDailySeries(range: StatRange) {
  const today = startOfDayUtc(new Date())
  let start: Date

  if (range === 'last7') {
    start = addDays(today, -6)
  } else if (range === 'month') {
    start = addDays(today, -29)
  } else {
    start = await getEarliestDate()
  }

  await ensureRange(start, today)

  const [rows, baselineAgg, totalAgg] = await Promise.all([
    prisma.promptDailyStats.findMany({
      where: {
        promptId: GLOBAL_PROMPT_ID,
        date: {
          gte: start,
          lte: today
        }
      },
      orderBy: { date: 'asc' }
    }),
    prisma.promptDailyStats.aggregate({
      _sum: { views: true, copies: true },
      where: {
        promptId: GLOBAL_PROMPT_ID,
        date: { lt: start }
      }
    }),
    prisma.promptDailyStats.aggregate({
      _sum: { views: true, copies: true },
      where: { promptId: GLOBAL_PROMPT_ID }
    })
  ])

  const baselineViews = baselineAgg._sum.views || 0
  const baselineCopies = baselineAgg._sum.copies || 0

  const totalViews = totalAgg._sum.views || 0
  const totalCopies = totalAgg._sum.copies || 0

  const map = new Map<string, { views: number; copies: number; updatedAt?: Date }>()
  rows.forEach((r) => {
    map.set(toDateKey(r.date), {
      views: r.views,
      copies: r.copies,
      updatedAt: r.updatedAt
    })
  })

  const series: DailyStatPoint[] = []
  let cumulativeViews = baselineViews
  let cumulativeCopies = baselineCopies
  let lastUpdated: Date | undefined

  for (
    let cursor = new Date(start);
    cursor <= today;
    cursor = addDays(cursor, 1)
  ) {
    const key = toDateKey(cursor)
    const existing = map.get(key)
    const views = existing?.views ?? 0
    const copies = existing?.copies ?? 0

    cumulativeViews += views
    cumulativeCopies += copies

    const pointUpdatedAt = existing?.updatedAt
    if (pointUpdatedAt && (!lastUpdated || pointUpdatedAt > lastUpdated)) {
      lastUpdated = pointUpdatedAt
    }

    series.push({
      date: key,
      views,
      copies,
      cumulativeViews,
      cumulativeCopies,
      updatedAt: pointUpdatedAt
    })
  }

  return {
    range,
    series,
    baseline: {
      views: baselineViews,
      copies: baselineCopies
    },
    totals: {
      views: totalViews,
      copies: totalCopies
    },
    lastUpdated: lastUpdated ? lastUpdated.toISOString() : null
  }
}

export async function getAllRanges() {
  const [last7, month, all] = await Promise.all([
    getDailySeries('last7'),
    getDailySeries('month'),
    getDailySeries('all')
  ])
  return { last7, month, all }
}

