import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'
import { recomputeAllPromptVectors } from '@/lib/recommend'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/prompts called')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    let session
    try {
      session = await auth()
      console.log('Session result:', session)
      console.log('Session user:', session?.user)
      console.log('Session user id:', session?.user?.id)
    } catch (authError) {
      console.error('Auth error:', authError)
      // Попробуем получить сессию через cookies
      const cookies = request.headers.get('cookie')
      console.log('Cookies:', cookies)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!session?.user) {
      console.log('No session or user, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем/создаем пользователя в базе
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.log('User not found in DB, creating...')
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          image: (session.user as any).image ?? null,
        }
      })
      console.log('User created:', user)
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { title, description, prompt, model, lang, category, tags, license, instructions, example } = body

    console.log('Creating prompt with authorId:', user.id)
    const newPrompt = await prisma.prompt.create({
      data: {
        title,
        description,
        prompt,
        model,
        lang,
        category,
        tags,
        license,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: { ratings: true },
        },
        ratings: {
          select: { value: true },
        },
      },
    })

    console.log('Prompt created:', newPrompt)

    // Update vector cache asynchronously (not blocking response)
    Promise.resolve(recomputeAllPromptVectors()).catch(() => {})

    // Преобразуем в формат интерфейса
    const ratings: number[] = (newPrompt.ratings || []).map((r: any) => r.value)
    const ratingCount = ratings.length
    const avg = ratingCount ? Number((ratings.reduce((a, b) => a + b, 0) / ratingCount).toFixed(1)) : 0

    const formattedPrompt = {
      id: newPrompt.id,
      title: newPrompt.title,
      description: newPrompt.description,
      model: newPrompt.model,
      lang: newPrompt.lang,
      tags: newPrompt.tags.split(',').map((tag: string) => tag.trim()),
      rating: avg,
      ratingCount,
      license: newPrompt.license as 'CC-BY' | 'CC0' | 'Custom' | 'Paid',
      prompt: newPrompt.prompt,
      author: newPrompt.author?.name || 'Anonymous',
      authorId: newPrompt.authorId,
      createdAt: newPrompt.createdAt.toISOString().split('T')[0],
    }

    console.log('Returning formatted prompt:', formattedPrompt)
    return NextResponse.json(formattedPrompt)
  } catch (error) {
    console.error('Error creating prompt:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')
    
    const whereClause = authorId ? { authorId } : {}
    
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

    // Summarize counted views from viewAnalytics for all prompts
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
        category: prompt.category,
        tags: prompt.tags.split(',').map((tag: string) => tag.trim()),
        rating: avg,
        ratingCount,
        likesCount: (prompt as any)._count?.likes ?? 0,
        savesCount: (prompt as any)._count?.saves ?? 0,
        commentsCount: (prompt as any)._count?.comments ?? 0,
        viewsCount: viewTotals.get(prompt.id) ?? prompt.views ?? 0,
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

    return NextResponse.json(formattedPrompts)
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
