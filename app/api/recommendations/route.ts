import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('for') || undefined
    const locale = url.searchParams.get('locale') || undefined
    
    console.log('Recommendations request for user:', userId, 'locale:', locale)
    
    // Простая версия - возвращаем топ промпты по рейтингу
    const prompts = await prisma.prompt.findMany({
      include: {
        ratings: { select: { value: true } },
        _count: { select: { likes: true, saves: true, comments: true, ratings: true } },
        author: { select: { name: true } },
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalRatings: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 12
    })

    console.log('Found prompts:', prompts.length)

    // Простое ранжирование по рейтингу и популярности
    const scored = prompts.map((p) => {
      const ratingScore = p.averageRating || 0
      const popularityScore = (p._count.ratings + p._count.likes + p._count.saves) / 10
      const score = ratingScore + popularityScore
      
      return { 
        id: p.id, 
        score, 
        prompt: p 
      }
    })

    scored.sort((a, b) => b.score - a.score)
    console.log('Returning recommendations:', scored.length)
    
    return NextResponse.json(scored.slice(0, 6))
  } catch (e) {
    console.error('GET /api/recommendations error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


