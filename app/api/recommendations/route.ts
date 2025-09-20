import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeIdfForTags, buildSparseVectorTfidf, parseTags, cosineSimilarity, computePromptBayesian, computePromptPopularity, normalizePopularity, finalRankingScore } from '@/lib/recommend'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('for') || undefined
    const locale = url.searchParams.get('locale') || undefined
    
    console.log('Recommendations request for user:', userId, 'locale:', locale)
    // Загружаем промпты с необходимыми счетчиками и автором
    const prompts = await prisma.prompt.findMany({
      include: {
        ratings: { select: { value: true } },
        _count: { select: { likes: true, saves: true, comments: true, ratings: true } },
        author: { select: { name: true } },
      },
      take: 200
    })

    const promptIds = prompts.map((p) => p.id)
    const viewTotals = new Map<string, number>()
    if (promptIds.length) {
      const aggregates = await prisma.viewAnalytics.groupBy({
        by: ['promptId'],
        where: { promptId: { in: promptIds } },
        _sum: { countedViews: true },
      })
      for (const row of aggregates) {
        viewTotals.set(row.promptId, row._sum.countedViews ?? 0)
      }

      const missingViewIds = promptIds.filter((id) => !viewTotals.has(id))
      if (missingViewIds.length) {
        const fallback = await prisma.promptViewEvent.groupBy({
          by: ['promptId'],
          where: { promptId: { in: missingViewIds }, isCounted: true },
          _count: { _all: true },
        })
        for (const row of fallback) {
          viewTotals.set(row.promptId, row._count._all ?? 0)
        }
      }

      const interactionIds = promptIds.filter((id) => !viewTotals.has(id))
      if (interactionIds.length) {
        const interactionFallback = await prisma.promptInteraction.groupBy({
          by: ['promptId'],
          where: { promptId: { in: interactionIds }, type: { in: ['view', 'open'] } },
          _count: { _all: true },
        })
        for (const row of interactionFallback) {
          viewTotals.set(row.promptId, row._count._all ?? 0)
        }
      }
    }

    const idf = computeIdfForTags(prompts as any)
    const popularityValues = prompts.map((p) => computePromptPopularity({
      _count: p._count as any,
      totalRatings: p.totalRatings,
      averageRating: p.averageRating,
      id: p.id, tags: p.tags, category: p.category, model: p.model, lang: p.lang,
    } as any))

    const scored = prompts.map((p) => {
      const v = buildSparseVectorTfidf({ tags: parseTags(p.tags), category: p.category, model: p.model, lang: p.lang }, idf)
      // Для cold-start используем вектор жанра/языка и популярности
      const cosine = v ? cosineSimilarity(v, v) : 0 // self-similarity = 1, но оставим 1 для ненулевого вектора
      const bayes = computePromptBayesian({
        id: p.id, tags: p.tags, category: p.category, model: p.model, lang: p.lang,
        ratings: p.ratings as any,
        _count: p._count as any,
        averageRating: p.averageRating,
        totalRatings: p.totalRatings,
      } as any)
      const pop = computePromptPopularity({ _count: p._count as any, totalRatings: p.totalRatings, averageRating: p.averageRating } as any)
      const popNorm = normalizePopularity(popularityValues, pop)
      const score = finalRankingScore({ cosine, popularityNorm: popNorm, bayesian: bayes })
      return { id: p.id, score, prompt: { ...p, views: viewTotals.get(p.id) ?? (p as any).views ?? 0, viewsCount: viewTotals.get(p.id) ?? (p as any).views ?? 0 } }
    })

    scored.sort((a, b) => b.score - a.score)
    console.log('Returning recommendations:', scored.length)
    return NextResponse.json(scored.slice(0, 12))
  } catch (e) {
    console.error('GET /api/recommendations error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
