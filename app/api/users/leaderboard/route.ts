import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'

export async function GET() {
  try {
    // Собираем всех авторов, у которых есть активность (промпты или рейтинги)
    const activeAuthors = await prisma.user.findMany({
      select: { id: true, name: true, image: true },
      where: {
        OR: [
          { prompts: { some: {} } },
          { ratings: { some: {} } },
        ],
      },
    })

    // Для устойчивости считаем репутацию на лету и не падаем на частных ошибках
    const rows: Array<{ id: string; name: string | null; image: string | null; reputationScore: number }> = []
    for (const a of activeAuthors) {
      try {
        const [promptCount, ratingsAgg, likesCnt, savesCnt, commentsCnt] = await Promise.all([
          prisma.prompt.count({ where: { authorId: a.id } }),
          prisma.rating.aggregate({ where: { prompt: { authorId: a.id } }, _avg: { value: true }, _count: { value: true } }),
          prisma.like.count({ where: { prompt: { authorId: a.id } } }),
          prisma.save.count({ where: { prompt: { authorId: a.id } } }),
          prisma.comment.count({ where: { prompt: { authorId: a.id } } }),
        ])
        const breakdown = calculateReputation({
          avgPromptRating: ratingsAgg._avg.value || 0,
          ratingsCount: ratingsAgg._count.value || 0,
          promptCount,
          likesCount: likesCnt,
          savesCount: savesCnt,
          commentsCount: commentsCnt,
        })

        // Пишем обновление best-effort, но результат возвращаем из расчета
        await prisma.user.update({
          where: { id: a.id },
          data: {
            reputationScore: breakdown.score0to100,
            reputationPromptCount: promptCount,
            reputationRatingsSum: Math.round((ratingsAgg._avg.value || 0) * (ratingsAgg._count.value || 0)),
            reputationRatingsCnt: ratingsAgg._count.value || 0,
            reputationLikesCnt: likesCnt,
            reputationSavesCnt: savesCnt,
            reputationCommentsCnt: commentsCnt,
          },
        }).catch(() => {})

        rows.push({ id: a.id, name: a.name, image: a.image, reputationScore: breakdown.score0to100 })
      } catch {
        rows.push({ id: a.id, name: a.name, image: a.image, reputationScore: 0 })
      }
    }

    const nonZero = rows.filter(r => r.reputationScore > 0)
    nonZero.sort((a, b) => b.reputationScore - a.reputationScore)
    return NextResponse.json(nonZero.slice(0, 100))
  } catch (e) {
    // Никогда не падаем — возвращаем пустой список
    return NextResponse.json([], { status: 200 })
  }
}


