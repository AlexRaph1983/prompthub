import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'

export async function updateUserReputation(userId: string) {
  console.log('Updating reputation for user:', userId)
  
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

  console.log('Reputation calculation inputs:', {
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
  console.log('Reputation breakdown:', breakdown)

  await prisma.user.update({
    where: { id: userId },
    data: {
      reputationScore: breakdown.score0to100,
      reputationPromptCount: inputs.promptCount,
      reputationRatingsSum: Math.round(inputs.avgPromptRating * inputs.ratingsCount),
      reputationRatingsCnt: inputs.ratingsCount,
      reputationLikesCnt: inputs.likesCount,
      reputationSavesCnt: inputs.savesCount,
      reputationCommentsCnt: inputs.commentsCount,
    },
  })

  console.log('User reputation updated successfully')
  return breakdown
}


