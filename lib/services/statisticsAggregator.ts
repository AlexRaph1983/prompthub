import { prisma } from '@/lib/prisma'

export type AggregatedDay = {
  date: string
  views: number
  copies: number
  aggregatedAt?: Date
  updatedAt?: Date
  cumulativeViews?: number
  cumulativeCopies?: number
  isSnapshot?: boolean
}

/**
 * Ежедневная агрегация просмотров и копирований.
 * Хранит результаты в таблице DailyStats (создаётся автоматически).
 */
class StatisticsAggregator {
  private tableReady: Promise<void> | null = null

  private startOfDay(date: Date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  private addDays(date: Date, days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
  }

  private dateKey(date: Date) {
    return this.startOfDay(date).toISOString().slice(0, 10)
  }

  private async ensureTable() {
    if (!this.tableReady) {
      this.tableReady = (async () => {
        // Универсальные таблица и индекс (SQLite/Postgres)
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "DailyStats" (
            "date" TEXT PRIMARY KEY,
            "views" INTEGER NOT NULL DEFAULT 0,
            "copies" INTEGER NOT NULL DEFAULT 0,
            "aggregatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `)

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "DailyStats_date_key"
          ON "DailyStats"("date");
        `)
      })()
    }

    return this.tableReady
  }

  private async getEarliestEventDate() {
    const [firstView, firstCopy] = await Promise.all([
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

    const dates = [
      firstView?.createdAt ?? null,
      firstCopy?.createdAt ?? null
    ].filter(Boolean) as Date[]

    if (dates.length === 0) return null

    const minTime = Math.min(...dates.map((d) => d.getTime()))
    return new Date(minTime)
  }

  private async countViews(start: Date, end: Date) {
    const res = await prisma.$queryRawUnsafe<
      Array<{ count: number | bigint }>
    >(
      `
        SELECT COUNT(*) as count
        FROM "PromptViewEvent"
        WHERE "isCounted" = 1
          AND "createdAt" >= ?
          AND "createdAt" < ?
      `,
      start.toISOString(),
      end.toISOString()
    )

    return Number(res?.[0]?.count ?? 0)
  }

  private async countCopies(start: Date, end: Date) {
    const res = await prisma.$queryRawUnsafe<
      Array<{ count: number | bigint }>
    >(
      `
        SELECT COUNT(*) as count
        FROM "PromptInteraction"
        WHERE "type" = 'copy'
          AND "createdAt" >= ?
          AND "createdAt" < ?
      `,
      start.toISOString(),
      end.toISOString()
    )

    return Number(res?.[0]?.count ?? 0)
  }

  async aggregateDay(
    date: Date,
    options: { persist?: boolean; logPrefix?: string } = {}
  ): Promise<AggregatedDay> {
    await this.ensureTable()

    const dayStart = this.startOfDay(date)
    const dayEnd = this.addDays(dayStart, 1)
    const dateKey = this.dateKey(dayStart)

    const [views, copies] = await Promise.all([
      this.countViews(dayStart, dayEnd),
      this.countCopies(dayStart, dayEnd)
    ])

    const now = new Date()
    const persist = options.persist !== false

    if (persist) {
      // Idempotent upsert по дате
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO "DailyStats" ("date", "views", "copies", "aggregatedAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT("date")
          DO UPDATE SET
            "views" = excluded."views",
            "copies" = excluded."copies",
            "updatedAt" = excluded."updatedAt"
        `,
        dateKey,
        views,
        copies,
        now.toISOString(),
        now.toISOString()
      )
    }

    if (options.logPrefix) {
      console.log(
        `${options.logPrefix} aggregated ${dateKey}: views=${views}, copies=${copies}, persisted=${persist}`
      )
    }

    return {
      date: dateKey,
      views,
      copies,
      aggregatedAt: now,
      updatedAt: now,
      isSnapshot: !persist
    }
  }

  private async fetchStored(): Promise<AggregatedDay[]> {
    await this.ensureTable()

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        date: string
        views: number
        copies: number
        aggregatedAt?: Date
        updatedAt?: Date
      }>
    >(`SELECT date, views, copies, aggregatedAt, updatedAt FROM "DailyStats" ORDER BY date ASC`)

    return (rows || []).map((row) => ({
      date: row.date,
      views: Number(row.views ?? 0),
      copies: Number(row.copies ?? 0),
      aggregatedAt: row.aggregatedAt ? new Date(row.aggregatedAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined
    }))
  }

  /**
   * Догоняем пропущенные дни до вчера включительно.
   */
  async backfillUntilYesterday(logPrefix = '[daily-stats]') {
    await this.ensureTable()

    const earliest = await this.getEarliestEventDate()
    if (!earliest) return [] as AggregatedDay[]

    const today = this.startOfDay(new Date())
    const lastFullDay = this.addDays(today, -1)

    if (lastFullDay < earliest) return [] as AggregatedDay[]

    const existing = new Set((await this.fetchStored()).map((s) => s.date))
    const aggregated: AggregatedDay[] = []

    for (
      let cursor = this.startOfDay(earliest);
      cursor <= lastFullDay;
      cursor = this.addDays(cursor, 1)
    ) {
      const key = this.dateKey(cursor)
      if (existing.has(key)) continue

      aggregated.push(
        await this.aggregateDay(cursor, { persist: true, logPrefix })
      )
    }

    return aggregated
  }

  /**
   * Возвращает весь ряд с кумулятивами и опциональным снапшотом за сегодня.
   */
  async getAllTimeSeries(options: {
    includeTodaySnapshot?: boolean
    logPrefix?: string
  } = {}): Promise<AggregatedDay[]> {
    await this.ensureTable()
    await this.backfillUntilYesterday(options.logPrefix)

    const todayKey = this.dateKey(new Date())
    let series = await this.fetchStored()

    if (options.includeTodaySnapshot && !series.some((d) => d.date === todayKey)) {
      const snapshot = await this.aggregateDay(new Date(), {
        persist: false,
        logPrefix: options.logPrefix
      })
      series = [...series, snapshot]
    }

    // Сортировка на случай добавления снапшота
    series.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

    let cumulativeViews = 0
    let cumulativeCopies = 0

    return series.map((item) => {
      cumulativeViews += item.views
      cumulativeCopies += item.copies
      return {
        ...item,
        cumulativeViews,
        cumulativeCopies
      }
    })
  }
}

export const statisticsAggregator = new StatisticsAggregator()

