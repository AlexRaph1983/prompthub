import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeIdfForTags, buildSparseVectorTfidf, parseTags, cosineSimilarity } from '@/lib/recommend'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const prompts = await prisma.prompt.findMany({ select: { id: true, tags: true, category: true, model: true, lang: true } })
    const current = prompts.find((p) => p.id === id)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const idf = computeIdfForTags(prompts as any)
    const base = buildSparseVectorTfidf(
      { tags: parseTags(current.tags), category: current.category, model: current.model, lang: current.lang },
      idf
    )

    const scored = prompts
      .filter((p) => p.id !== id)
      .map((p) => {
        const v = buildSparseVectorTfidf(
          { tags: parseTags(p.tags), category: p.category, model: p.model, lang: p.lang },
          idf
        )
        const cosine = cosineSimilarity(base, v)
        return { id: p.id, cosine }
      })
      .sort((a, b) => b.cosine - a.cosine)
      .slice(0, 12)

    return NextResponse.json(scored)
  } catch (e) {
    console.error('GET /api/prompts/[id]/similar error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


