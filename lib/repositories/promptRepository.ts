import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'

export interface PromptCardDTO {
  id: string
  title: string
  description: string
  model: string
  lang: string
  category: string
  tags: string[]
  rating: number
  ratingCount: number
  likesCount: number
  savesCount: number
  commentsCount: number
  views: number
  license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
  prompt: string
  author: string
  authorId: string
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

export interface PromptListParams {
  limit?: number
  cursor?: string | null
  sort?: 'createdAt' | 'rating' | 'views'
  order?: 'asc' | 'desc'
  authorId?: string
  search?: string
  tags?: string[]
  category?: string
  model?: string
  lang?: string
}

export interface PromptListResult {
  items: PromptCardDTO[]
  nextCursor: string | null
  hasMore: boolean
  totalCount?: number
}

export class PromptRepository {
  private async getViewCounts(promptIds: string[]): Promise<Map<string, number>> {
    const viewTotals = new Map<string, number>()
    
    if (promptIds.length === 0) return viewTotals

    // Сначала пытаемся получить из viewAnalytics
    const aggregates = await prisma.viewAnalytics.groupBy({
      by: ['promptId'],
      where: { promptId: { in: promptIds } },
      _sum: { countedViews: true },
    })
    
    for (const row of aggregates) {
      viewTotals.set(row.promptId, row._sum.countedViews ?? 0)
    }

    // Fallback к promptViewEvent для недостающих
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

    // Final fallback к promptInteraction
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

    return viewTotals
  }

  private buildWhereClause(params: PromptListParams) {
    const where: any = {}

    if (params.authorId) {
      where.authorId = params.authorId
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.model) {
      where.model = params.model
    }

    if (params.lang) {
      where.lang = params.lang
    }

    if (params.tags && params.tags.length > 0) {
      where.tags = {
        contains: params.tags.join(','),
        mode: 'insensitive'
      }
    }

    return where
  }

  private buildOrderBy(params: PromptListParams) {
    const sort = params.sort || 'createdAt'
    const order = params.order || 'desc'

    switch (sort) {
      case 'rating':
        return [
          { averageRating: order as 'asc' | 'desc' },
          { createdAt: 'desc' as const },
          { id: 'desc' as const }
        ]
      case 'views':
        return [
          { views: order as 'asc' | 'desc' },
          { createdAt: 'desc' as const },
          { id: 'desc' as const }
        ]
      case 'createdAt':
      default:
        return [
          { createdAt: order as 'asc' | 'desc' },
          { id: 'desc' as const }
        ]
    }
  }

  async listPrompts(params: PromptListParams = {}): Promise<PromptListResult> {
    const limit = Math.min(params.limit || 20, 50) // Максимум 50
    const where = this.buildWhereClause(params)
    const orderBy = this.buildOrderBy(params)

    // Если есть cursor, добавляем условие для cursor-based pagination
    if (params.cursor) {
      const cursorPrompt = await prisma.prompt.findUnique({
        where: { id: params.cursor },
        select: { createdAt: true, id: true }
      })

      if (cursorPrompt) {
        const cursorCondition = params.order === 'asc' 
          ? { 
              OR: [
                { createdAt: { gt: cursorPrompt.createdAt } },
                { 
                  createdAt: cursorPrompt.createdAt,
                  id: { gt: cursorPrompt.id }
                }
              ]
            }
          : {
              OR: [
                { createdAt: { lt: cursorPrompt.createdAt } },
                { 
                  createdAt: cursorPrompt.createdAt,
                  id: { lt: cursorPrompt.id }
                }
              ]
            }
        
        where.AND = where.AND ? [where.AND, cursorCondition] : [cursorCondition]
      }
    }

    // Запрашиваем на один элемент больше для определения hasMore
    const prompts = await prisma.prompt.findMany({
      where,
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
      orderBy,
      take: limit + 1, // Берем на один больше
    })

    // Определяем hasMore и nextCursor
    const hasMore = prompts.length > limit
    const items = hasMore ? prompts.slice(0, limit) : prompts
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null

    // Получаем view counts для всех промптов
    const promptIds = items.map(p => p.id)
    const viewCounts = await this.getViewCounts(promptIds)

    // Кэш для репутации авторов больше не нужен - используем кэшированные значения из БД

    // Преобразуем в DTO
    const formattedPrompts = await Promise.all(items.map(async (prompt: any) => {
      // Используем кэшированные значения рейтинга из БД
      const avg = prompt.averageRating || 0
      const ratingCount = prompt.totalRatings || 0

      // Используем кэшированную репутацию автора из БД
      const authorScore = prompt.author?.reputationScore || 0
      const authorTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 
        authorScore >= 85 ? 'platinum' : 
        authorScore >= 65 ? 'gold' : 
        authorScore >= 40 ? 'silver' : 'bronze'

      return {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        model: prompt.model,
        lang: prompt.lang,
        category: prompt.category,
        tags: prompt.tags.split(',').map((tag: string) => tag.trim()),
        rating: avg,
        ratingCount,
        likesCount: (prompt as any)._count?.likes ?? 0,
        savesCount: (prompt as any)._count?.saves ?? 0,
        commentsCount: (prompt as any)._count?.comments ?? 0,
        views: Math.max(viewCounts.get(prompt.id) ?? 0, prompt.views ?? 0),
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
        createdAt: prompt.createdAt.toISOString(),
      } as PromptCardDTO
    }))

    return {
      items: formattedPrompts,
      nextCursor,
      hasMore,
    }
  }

  async getTotalCount(params: Omit<PromptListParams, 'limit' | 'cursor'> = {}): Promise<number> {
    const where = this.buildWhereClause(params)
    
    return prisma.prompt.count({ where })
  }
}

export const promptRepository = new PromptRepository()
