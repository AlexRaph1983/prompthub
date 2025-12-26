/**
 * Read-only анализ контента/данных PromptHub (SQLite/Postgres через Prisma).
 *
 * Метрики:
 * - всего промптов
 * - просмотры по промптам (используем поле Prompt.views как основной источник)
 * - распределение просмотров по категориям (Category)
 * - TOP категорий по просмотрам + доли
 * - квоты на добавление N новых промптов по доле просмотров
 *
 * Запуск:
 *   node scripts/analyze-site-content.js
 *   node scripts/analyze-site-content.js --new=300
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { newCount: 300 }
  for (const a of args) {
    if (a.startsWith('--new=')) out.newCount = Math.max(0, parseInt(a.slice('--new='.length), 10) || 0)
  }
  return out
}

function pct(part, total) {
  if (!total) return 0
  return (part / total) * 100
}

function allocateByShares(total, shares) {
  // shares: Array<{ key: string, share: number (0..1) }>
  const raw = shares.map((s) => ({ ...s, raw: s.share * total }))
  const base = raw.map((s) => ({ ...s, n: Math.floor(s.raw), frac: s.raw - Math.floor(s.raw) }))
  let remaining = total - base.reduce((sum, s) => sum + s.n, 0)

  base.sort((a, b) => b.frac - a.frac)
  for (let i = 0; i < base.length && remaining > 0; i++) {
    base[i].n += 1
    remaining -= 1
  }

  // вернуть в исходном порядке по ключу
  const map = new Map(base.map((b) => [b.key, b.n]))
  return shares.map((s) => ({ key: s.key, n: map.get(s.key) || 0 }))
}

async function main() {
  const { newCount } = parseArgs()

  const [categories, prompts, viewAnalyticsAgg, viewEventsAgg, interactionsAgg] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, nameRu: true, nameEn: true, parentId: true, promptCount: true }
    }),
    prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        views: true,
        category: true,
        categoryId: true,
        model: true,
        lang: true,
        authorId: true,
        createdAt: true
      }
    }),
    // Batch-агрегации просмотров (по приоритетам ViewsService, но оптимизировано)
    prisma.viewAnalytics
      .groupBy({
        by: ['promptId'],
        _sum: { countedViews: true }
      })
      .catch(() => []),
    prisma.promptViewEvent
      .groupBy({
        by: ['promptId'],
        where: { isCounted: true },
        _count: { _all: true }
      })
      .catch(() => []),
    prisma.promptInteraction
      .groupBy({
        by: ['promptId'],
        where: { type: 'view' },
        _count: { _all: true }
      })
      .catch(() => [])
  ])

  const totalPrompts = prompts.length

  const analyticsByPrompt = new Map(
    (viewAnalyticsAgg || []).map((r) => [r.promptId, Number(r._sum?.countedViews || 0)])
  )
  const eventsByPrompt = new Map((viewEventsAgg || []).map((r) => [r.promptId, Number(r._count?._all || 0)]))
  const interactionsByPrompt = new Map(
    (interactionsAgg || []).map((r) => [r.promptId, Number(r._count?._all || 0)])
  )

  const resolvedViewsByPrompt = new Map()
  for (const p of prompts) {
    const a = analyticsByPrompt.get(p.id) || 0
    const e = eventsByPrompt.get(p.id) || 0
    const v = Number(p.views || 0)
    const i = interactionsByPrompt.get(p.id) || 0
    const resolved = a > 0 ? a : e > 0 ? e : v > 0 ? v : i
    resolvedViewsByPrompt.set(p.id, resolved)
  }

  const totalViews = Array.from(resolvedViewsByPrompt.values()).reduce((sum, n) => sum + (n || 0), 0)

  const catsById = new Map(categories.map((c) => [c.id, c]))
  const catsByNameEn = new Map(categories.map((c) => [c.nameEn, c]))

  // Аггрегация по категориям (первичный ключ — categoryId если есть, иначе nameEn)
  const byCategory = new Map()

  function ensureCatBucket(cat) {
    const key = cat?.id || `nameEn:${cat?.nameEn || 'Unknown'}`
    if (!byCategory.has(key)) {
      byCategory.set(key, {
        key,
        id: cat?.id || null,
        slug: cat?.slug || null,
        nameRu: cat?.nameRu || null,
        nameEn: cat?.nameEn || null,
        parentId: cat?.parentId || null,
        promptCount: 0,
        views: 0
      })
    }
    return byCategory.get(key)
  }

  for (const p of prompts) {
    const cat =
      (p.categoryId && catsById.get(p.categoryId)) ||
      (p.category && catsByNameEn.get(p.category)) ||
      null

    const bucket = ensureCatBucket(cat)
    bucket.promptCount += 1
    bucket.views += resolvedViewsByPrompt.get(p.id) || 0
  }

  const categoryRows = Array.from(byCategory.values()).map((r) => ({
    ...r,
    viewsPerPrompt: r.promptCount ? r.views / r.promptCount : 0
  }))

  categoryRows.sort((a, b) => b.views - a.views)

  const topN = 10
  const topCategories = categoryRows.slice(0, topN)

  // распределение для квот: только активные категории верхнего уровня (без подкатегорий)
  const topLevelCats = categories.filter((c) => !c.parentId)
  const viewsByTopLevel = topLevelCats.map((c) => {
    const bucket = categoryRows.find((r) => r.id === c.id)
    return { cat: c, views: bucket?.views || 0, prompts: bucket?.promptCount || 0 }
  })

  const topLevelTotalViews = viewsByTopLevel.reduce((s, r) => s + r.views, 0)
  const shares = viewsByTopLevel
    .filter((r) => r.views > 0)
    .map((r) => ({ key: r.cat.slug, share: r.views / topLevelTotalViews }))

  const quotas = topLevelTotalViews > 0 ? allocateByShares(newCount, shares) : []

  // Доп. срезы
  const langs = new Map()
  const models = new Map()
  for (const p of prompts) {
    langs.set(p.lang, (langs.get(p.lang) || 0) + 1)
    models.set(p.model, (models.get(p.model) || 0) + 1)
  }

  const langDist = Array.from(langs.entries()).sort((a, b) => b[1] - a[1])
  const modelDist = Array.from(models.entries()).sort((a, b) => b[1] - a[1])

  console.log('=== PromptHub content analytics (read-only) ===')
  console.log('Prompts total:', totalPrompts)
  console.log('Views total (resolved, ViewsService-like priorities):', totalViews)
  console.log('Active categories:', categories.length, `(top-level: ${topLevelCats.length})`)
  console.log('')

  console.log('--- Languages (by prompts count) ---')
  langDist.slice(0, 20).forEach(([lang, count]) => console.log(`- ${lang}: ${count}`))
  console.log('')

  console.log('--- Models (by prompts count) ---')
  modelDist.slice(0, 30).forEach(([m, count]) => console.log(`- ${m}: ${count}`))
  console.log('')

  console.log(`--- TOP ${topN} categories by views ---`)
  topCategories.forEach((c, idx) => {
    const share = pct(c.views, totalViews)
    console.log(
      `${String(idx + 1).padStart(2, '0')}. ${c.slug || c.nameEn || c.key} | views=${c.views} | prompts=${c.promptCount} | v/p=${c.viewsPerPrompt.toFixed(
        2
      )} | share=${share.toFixed(2)}%`
    )
  })
  console.log('')

  console.log('--- Top-level categories (views share) ---')
  viewsByTopLevel
    .sort((a, b) => b.views - a.views)
    .forEach((r) => {
      console.log(
        `- ${r.cat.slug} (${r.cat.nameRu}): views=${r.views} | prompts=${r.prompts} | share=${pct(r.views, topLevelTotalViews).toFixed(2)}%`
      )
    })
  console.log('')

  console.log(`--- Quotas for +${newCount} prompts by top-level views share ---`)
  if (topLevelTotalViews === 0) {
    console.log('No views found in top-level categories; quotas not computed (total views = 0).')
  } else {
    const qMap = new Map(quotas.map((q) => [q.key, q.n]))
    viewsByTopLevel
      .sort((a, b) => b.views - a.views)
      .filter((r) => r.views > 0)
      .forEach((r) => {
        console.log(
          `- ${r.cat.slug}: +${qMap.get(r.cat.slug) || 0} (share=${pct(r.views, topLevelTotalViews).toFixed(2)}%)`
        )
      })
    console.log('Sum:', quotas.reduce((s, q) => s + q.n, 0))
  }
}

main()
  .catch((e) => {
    console.error('Analysis failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


