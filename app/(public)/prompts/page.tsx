import { unstable_setRequestLocale } from 'next-intl/server'
import PromptsClient from './PromptsClient'
import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'

interface Prompt {
    id: string
    title: string
    description: string
    model: string
    lang: string
    tags: string[]
    rating: number
    ratingCount?: number
  likesCount: number
  savesCount: number
  commentsCount: number
    license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
    prompt: string
    author: string
    authorId?: string
  authorReputationScore: number
  authorReputationTier: string
    authorProfile?: {
      id: string
      name: string
      image?: string
      bio?: string
      website?: string
      telegram?: string
      github?: string
      twitter?: string
      linkedin?: string
      reputationScore: number
      reputationPromptCount: number
      reputationLikesCnt: number
      reputationSavesCnt: number
      reputationRatingsCnt: number
      reputationCommentsCnt: number
    }
  createdAt: string
}

interface AuthorInfo {
  name: string
  reputationScore: number
  tier: string
  bio?: string
  website?: string
  telegram?: string
  github?: string
  twitter?: string
  linkedin?: string
  reputationPromptCount: number
  reputationLikesCnt: number
  reputationSavesCnt: number
  reputationRatingsCnt: number
  reputationCommentsCnt: number
}

async function getPrompts(authorId?: string, page: number = 1, limit: number = 20): Promise<{ prompts: Prompt[], pagination: any }> {
  try {
    const whereClause = authorId ? { authorId } : {}
    const skip = (page - 1) * limit

    // Получаем общее количество промптов для пагинации
    const totalCount = await prisma.prompt.count({ where: whereClause })

    const prompts = await prisma.prompt.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            name: true,
            image: true,
            bio: true,
            website: true,
            telegram: true,
            github: true,
            twitter: true,
            linkedin: true,
            reputationScore: true,
            reputationPromptCount: true,
            reputationRatingsCnt: true,
            reputationLikesCnt: true,
            reputationSavesCnt: true,
            reputationCommentsCnt: true,
          },
        },
        _count: { select: { ratings: true, likes: true, saves: true, comments: true } },
        ratings: { select: { value: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    // Преобразуем в формат интерфейса и считаем репутацию авторов на лету
    const authorCache = new Map<string, { score: number; tier: 'bronze' | 'silver' | 'gold' | 'platinum' }>()
    const formattedPrompts = await Promise.all(prompts.map(async (prompt: any) => {
      const ratings: number[] = (prompt.ratings || []).map((r: any) => r.value)
      const ratingCount = ratings.length
      const avg = ratingCount ? Number((ratings.reduce((a, b) => a + b, 0) / ratingCount).toFixed(1)) : 0

      // Получаем или рассчитываем репутацию автора
      let authorScore = prompt.author?.reputationScore || 0
      let authorTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze'

      if (authorCache.has(prompt.authorId)) {
        const cached = authorCache.get(prompt.authorId)!
        authorScore = cached.score
        authorTier = cached.tier
      } else {
        // Рассчитываем репутацию на лету
        const breakdown = calculateReputation({
          avgPromptRating: avg,
          ratingsCount: ratingCount,
          promptCount: prompt.author?.reputationPromptCount || 0,
          likesCount: (prompt as any)._count?.likes ?? 0,
          savesCount: (prompt as any)._count?.saves ?? 0,
          commentsCount: (prompt as any)._count?.comments ?? 0,
        })
        authorScore = breakdown.score0to100
        authorTier = breakdown.tier
        authorCache.set(prompt.authorId, { score: authorScore, tier: authorTier })
      }

      return ({
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        model: prompt.model,
        lang: prompt.lang,
        tags: prompt.tags.split(',').map((tag: string) => tag.trim()),
        rating: avg,
        ratingCount,
        likesCount: (prompt as any)._count?.likes ?? 0,
        savesCount: (prompt as any)._count?.saves ?? 0,
        commentsCount: (prompt as any)._count?.comments ?? 0,
        license: prompt.license as 'CC-BY' | 'CC0' | 'Custom' | 'Paid',
        prompt: prompt.prompt,
        author: prompt.author?.name || 'Anonymous',
        authorId: prompt.authorId,
        authorReputationScore: authorScore,
        authorReputationTier: authorTier,
        authorProfile: {
          id: prompt.authorId,
          name: prompt.author?.name || 'Anonymous',
          image: prompt.author?.image,
          bio: prompt.author?.bio,
          website: prompt.author?.website,
          telegram: prompt.author?.telegram,
          github: prompt.author?.github,
          twitter: prompt.author?.twitter,
          linkedin: prompt.author?.linkedin,
          reputationScore: authorScore,
          reputationPromptCount: prompt.author?.reputationPromptCount || 0,
          reputationLikesCnt: prompt.author?.reputationLikesCnt || 0,
          reputationSavesCnt: prompt.author?.reputationSavesCnt || 0,
          reputationRatingsCnt: prompt.author?.reputationRatingsCnt || 0,
          reputationCommentsCnt: prompt.author?.reputationCommentsCnt || 0,
        },
        createdAt: prompt.createdAt.toISOString().split('T')[0],
      })
    }))

    return {
      prompts: formattedPrompts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      }
    }
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return {
      prompts: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }
    }
  }
}

export default async function PromptsPage({
  searchParams,
  params: { locale }
}: {
  searchParams: { authorId?: string }
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  const authorId = searchParams.authorId

  const { prompts, pagination } = await getPrompts(authorId, 1, 20)

  let authorInfo: AuthorInfo | null = null
  if (authorId && prompts.length > 0) {
    const firstPrompt = prompts[0]
    if (firstPrompt.authorProfile) {
      authorInfo = {
        name: firstPrompt.authorProfile.name,
        reputationScore: firstPrompt.authorProfile.reputationScore,
        tier: firstPrompt.authorReputationTier || 'bronze',
        bio: firstPrompt.authorProfile.bio,
        website: firstPrompt.authorProfile.website,
        telegram: firstPrompt.authorProfile.telegram,
        github: firstPrompt.authorProfile.github,
        twitter: firstPrompt.authorProfile.twitter,
        linkedin: firstPrompt.authorProfile.linkedin,
        reputationPromptCount: firstPrompt.authorProfile.reputationPromptCount,
        reputationLikesCnt: firstPrompt.authorProfile.reputationLikesCnt,
        reputationSavesCnt: firstPrompt.authorProfile.reputationSavesCnt,
        reputationRatingsCnt: firstPrompt.authorProfile.reputationRatingsCnt,
        reputationCommentsCnt: firstPrompt.authorProfile.reputationCommentsCnt,
      }
    }
  }

  return (
    <PromptsClient
      initialPrompts={prompts}
      initialPagination={pagination}
      authorInfo={authorInfo}
      authorId={authorId}
      locale={locale}
    />
  )
} 