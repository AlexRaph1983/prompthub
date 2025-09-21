import { NextRequest, NextResponse } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateReputation } from '@/lib/reputation'
import { recomputeAllPromptVectors } from '@/lib/recommend'

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/prompts called')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    let session
    try {
      session = await authFromRequest(request)
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
    
    // Параметры пагинации
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const cursor = searchParams.get('cursor')
    const sort = searchParams.get('sort') as 'createdAt' | 'rating' | 'views' || 'createdAt'
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc'
    
    // Фильтры
    const authorId = searchParams.get('authorId')
    const search = searchParams.get('q')
    const category = searchParams.get('category')
    const model = searchParams.get('model')
    const lang = searchParams.get('lang')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    // Импортируем репозиторий
    const { promptRepository } = await import('@/lib/repositories/promptRepository')

    const result = await promptRepository.listPrompts({
      limit,
      cursor: cursor || null,
      sort,
      order,
      authorId: authorId || undefined,
      search: search || undefined,
      category: category || undefined,
      model: model || undefined,
      lang: lang || undefined,
      tags: tags || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
