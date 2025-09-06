import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserReputation } from '@/lib/reputationService'

function sanitizeComment(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Ограничим длину 2000 символов
  return trimmed.slice(0, 2000)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')
    if (!promptId) return NextResponse.json({ error: 'promptId required' }, { status: 400 })

    const session = await auth().catch(() => null)

    const [reviews, prompt] = await Promise.all([
      prisma.review.findMany({
        where: { promptId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
          user: { select: { name: true, image: true } },
        },
      }),
      prisma.prompt.findUnique({ where: { id: promptId }, select: { id: true, authorId: true } }),
    ])

    const myReview = session?.user?.id
      ? reviews.find((r) => r.userId === session.user.id) || null
      : null

    return NextResponse.json({
      promptId,
      authorId: prompt?.authorId ?? null,
      total: reviews.length,
      reviews,
      myReview,
    })
  } catch (e) {
    console.error('GET /api/reviews error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const promptId: unknown = body?.promptId
    const rating: unknown = body?.rating
    const comment = sanitizeComment(body?.comment)

    if (typeof promptId !== 'string' || !promptId) {
      return NextResponse.json({ error: 'Invalid promptId' }, { status: 400 })
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating (must be 1..5)' }, { status: 400 })
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, select: { id: true, authorId: true } })
    if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    if (prompt.authorId === session.user.id) {
      return NextResponse.json({ error: 'Cannot review your own prompt' }, { status: 403 })
    }

    // Ensure user exists for FK (как и в /api/ratings)
    const existingUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: session.user.id,
          email: (session.user as any).email ?? null,
          name: session.user.name ?? null,
          image: (session.user as any).image ?? null,
          updatedAt: new Date(),
        } as any,
      })
    }

    // Запрещаем изменять уже существующий отзыв/рейтинг
    const existing = await prisma.review.findUnique({ where: { promptId_userId: { promptId, userId: session.user.id } } })
    if (existing) {
      const [count, avg] = await Promise.all([
        prisma.review.count({ where: { promptId } }),
        prisma.review.aggregate({ where: { promptId }, _avg: { rating: true } }),
      ])
      return NextResponse.json({
        promptId,
        review: existing,
        average: Number((avg._avg.rating || 0).toFixed(1)),
        count,
      }, { status: 409 })
    }

    const review = await prisma.review.create({
      data: { promptId, userId: session.user.id, rating, comment },
      select: { id: true, rating: true, comment: true, createdAt: true, userId: true },
    })

    // keep Rating table in sync (создаём только один раз)
    await prisma.rating.create({
      data: { userId: session.user.id, promptId, value: rating },
    })

    // recalc aggregates from reviews
    const [count, avg] = await Promise.all([
      prisma.review.count({ where: { promptId } }),
      prisma.review.aggregate({ where: { promptId }, _avg: { rating: true } }),
    ])

    const average = Number((avg._avg.rating || 0).toFixed(1))

    await prisma.prompt.update({
      where: { id: promptId },
      data: { averageRating: average, totalRatings: count },
    })

    // Fire-and-forget: обновляем репутацию автора
    if (typeof updateUserReputation === 'function') {
      Promise.resolve(updateUserReputation(prompt.authorId)).catch(() => {})
    }

    return NextResponse.json({
      promptId,
      review,
      average,
      count,
    })
  } catch (e) {
    console.error('POST /api/reviews error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


