import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    console.log('GET /api/users/[id]/reputation - userId:', userId)

    // Получаем данные пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      console.log('GET /api/users/[id]/reputation - user not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Собираем данные для расчёта репутации
    const [promptCount, ratingsAgg, likesCnt, savesCnt, commentsCnt] = await Promise.all([
      prisma.prompt.count({ where: { authorId: userId } }),
      prisma.rating.aggregate({
        where: { prompt: { authorId: userId } },
        _avg: { value: true },
        _count: { value: true },
      }),
      prisma.like.count({ where: { prompt: { authorId: userId } } }),
      prisma.save.count({ where: { prompt: { authorId: userId } } }),
      prisma.comment.count({ where: { prompt: { authorId: userId } } }),
    ])

    console.log('GET /api/users/[id]/reputation - data collected:', {
      promptCount,
      avgRating: ratingsAgg._avg.value,
      ratingsCount: ratingsAgg._count.value,
      likesCount: likesCnt,
      savesCount: savesCnt,
      commentsCount: commentsCnt,
    })

    const inputs = {
      avgPromptRating: ratingsAgg._avg.value || 0,
      ratingsCount: ratingsAgg._count.value || 0,
      promptCount,
      likesCount: likesCnt,
      savesCount: savesCnt,
      commentsCount: commentsCnt,
    }

    const breakdown = calculateReputation(inputs)

    console.log('GET /api/users/[id]/reputation - reputation calculated:', breakdown)

    return NextResponse.json({
      userId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      reputation: breakdown,
    })
  } catch (error) {
    console.error('GET /api/users/[id]/reputation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


