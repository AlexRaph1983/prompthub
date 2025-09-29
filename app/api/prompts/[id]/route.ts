import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authFromRequest } from '@/lib/auth'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
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
            reputationLikesCnt: true,
            reputationSavesCnt: true,
            reputationRatingsCnt: true,
            reputationCommentsCnt: true,
          }
        },
        _count: {
          select: {
            likes: true,
            saves: true,
            ratings: true,
            comments: true,
          }
        }
      }
    })
    if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    // Преобразуем данные в нужный формат
    const formattedPrompt = {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      model: prompt.model,
      lang: prompt.lang,
      category: prompt.category,
      tags: prompt.tags ? prompt.tags.split(',').map(tag => tag.trim()) : [],
      rating: prompt.averageRating || 0,
      ratingCount: prompt.totalRatings || 0,
      likesCount: prompt._count.likes,
      savesCount: prompt._count.saves,
      commentsCount: prompt._count.comments,
      license: prompt.license,
      prompt: prompt.prompt,
      author: prompt.author?.name || 'Unknown',
      authorId: prompt.authorId,
      authorProfile: prompt.author ? {
        id: prompt.author.id,
        name: prompt.author.name,
        image: prompt.author.image,
        bio: prompt.author.bio,
        website: prompt.author.website,
        telegram: prompt.author.telegram,
        github: prompt.author.github,
        twitter: prompt.author.twitter,
        linkedin: prompt.author.linkedin,
        reputationScore: prompt.author.reputationScore,
        reputationPromptCount: prompt.author.reputationPromptCount,
        reputationLikesCnt: prompt.author.reputationLikesCnt,
        reputationSavesCnt: prompt.author.reputationSavesCnt,
        reputationRatingsCnt: prompt.author.reputationRatingsCnt,
        reputationCommentsCnt: prompt.author.reputationCommentsCnt,
      } : undefined,
      instructions: prompt.instructions,
      example: prompt.example,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt?.toISOString(),
      views: prompt.views || 0,
    }
    
    return NextResponse.json(formattedPrompt)
  } catch (e) {
    console.error('Error fetching prompt:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await authFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.prompt.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updatable: any = {}
    for (const key of ['title', 'description', 'prompt', 'model', 'lang', 'category', 'tags', 'license']) {
      if (typeof body[key] !== 'undefined') updatable[key] = body[key]
    }

    const updated = await prisma.prompt.update({ where: { id: params.id }, data: updatable })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


