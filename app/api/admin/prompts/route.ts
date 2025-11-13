import { NextRequest, NextResponse } from 'next/server'
import { prisma, deletePromptAndSync } from '@/lib/prisma'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const adminSession = await requirePermission('prompts_view', request)
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Строим условия поиска
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { prompt: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { author: { name: { contains: search, mode: 'insensitive' } } },
        { author: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (category) {
      where.category = category
    }

    // Сортировка
    const orderBy: any = {}
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = sortOrder
    } else if (sortBy === 'rating') {
      orderBy.averageRating = sortOrder
    } else if (sortBy === 'views') {
      orderBy.views = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            }
          },
          _count: {
            select: {
              ratings: true,
              reviews: true,
              likes: true,
              saves: true,
              comments: true,
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.prompt.count({ where })
    ])

    // Получаем статистику по категориям для фильтров
    const categories = await prisma.prompt.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    return NextResponse.json({
      prompts: prompts.map(prompt => ({
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        prompt: prompt.prompt,
        model: prompt.model,
        lang: prompt.lang,
        category: prompt.category,
        tags: prompt.tags,
        license: prompt.license,
        author: prompt.author,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
        averageRating: prompt.averageRating,
        totalRatings: prompt.totalRatings,
        views: prompt.views,
        stats: prompt._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
      filters: {
        categories: categories.map(c => ({
          category: c.category,
          count: c._count.category
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching admin prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const adminSession = await requirePermission('prompts_delete', request)
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('id')

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    // Проверяем существование промпта
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: { author: { select: { id: true, name: true, email: true } } }
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Удаляем промпт и автоматически обновляем счётчик категории
    await deletePromptAndSync({ id: promptId })

    console.log(`[ADMIN] Prompt deleted by ${adminSession.user.email}: ${prompt.title} (ID: ${promptId}) by ${prompt.author.email}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Prompt deleted successfully',
      deletedPrompt: {
        id: prompt.id,
        title: prompt.title,
        author: prompt.author
      }
    })
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
