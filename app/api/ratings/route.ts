import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserReputation } from '@/lib/reputationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')
    if (!promptId) return NextResponse.json({ error: 'promptId required' }, { status: 400 })

    const session = await auth().catch(() => null)
    console.log('GET /api/ratings - session:', session?.user?.id ? 'authenticated' : 'not authenticated')
    
    const prompt = await prisma.prompt.findUnique({ 
      where: { id: promptId }, 
      select: { authorId: true, title: true } 
    })
    console.log('GET /api/ratings - prompt found:', !!prompt, 'authorId:', prompt?.authorId)

    // Получаем кэшированные значения рейтинга из БД
    const promptWithRating = await prisma.prompt.findUnique({ 
      where: { id: promptId }, 
      select: { averageRating: true, totalRatings: true } 
    })
    
    const [my] = await Promise.all([
      session?.user?.id
        ? prisma.rating.findUnique({ where: { userId_promptId: { userId: session.user.id, promptId } } })
        : Promise.resolve(null),
    ])
    
    const count = promptWithRating?.totalRatings || 0
    const average = promptWithRating?.averageRating || 0

    // Правило: оценка ставится один раз
    // - Неавторизован: canRate = true (UI попросит войти)
    // - Если автор: canRate = false
    // - Если уже оценивал: canRate = false
    // - Иначе: true
    let canRate = true
    let reason = ''

    if (session?.user?.id) {
      if (prompt?.authorId === session.user.id) {
        canRate = false
        reason = 'own_prompt'
        console.log('GET /api/ratings - user is author, cannot rate own prompt')
      } else if (my) {
        canRate = false
        reason = 'already_rated'
        console.log('GET /api/ratings - user already rated this prompt')
      } else {
        canRate = true
        reason = 'can_rate'
        console.log('GET /api/ratings - user can rate this prompt')
      }
    } else {
      canRate = true
      reason = 'not_authenticated'
      console.log('GET /api/ratings - user not authenticated, will prompt login')
    }

    console.log('GET /api/ratings - result:', { 
      count, 
      average, 
      myRating: my?.value, 
      canRate,
      reason,
      isAuthor: prompt?.authorId === session?.user?.id
    })

    return NextResponse.json({
      promptId,
      average: Number(average.toFixed(1)),
      count,
      myRating: my?.value ?? null,
      canRate,
    })
  } catch (e) {
    console.error('GET /api/ratings error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    console.log('POST /api/ratings - session:', session?.user?.id ? 'authenticated' : 'not authenticated')
    
    if (!session?.user?.id) {
      console.log('POST /api/ratings - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { promptId, value } = await request.json()
    console.log('POST /api/ratings - payload:', { promptId, value })
    
    if (!promptId || typeof value !== 'number' || value < 1 || value > 5) {
      console.log('POST /api/ratings - invalid payload')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Ensure user exists to satisfy FK constraints for Rating
    // Some auth providers may not create a user row until the first write.
    const existingUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!existingUser) {
      console.log('POST /api/ratings - creating user:', session.user.id)
      await prisma.user.create({
        data: {
          id: session.user.id,
          // email is optional in schema; include if available
          email: (session.user as any).email ?? null,
          name: session.user.name ?? null,
          image: (session.user as any).image ?? null,
        } as any,
      })
    }

    // ТЩАТЕЛЬНАЯ ПРОВЕРКА: Получаем промпт с автором
    const prompt = await prisma.prompt.findUnique({ 
      where: { id: promptId }, 
      select: { id: true, authorId: true, title: true } 
    })
    
    if (!prompt) {
      console.log('POST /api/ratings - prompt not found:', promptId)
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }
    
    // ТЩАТЕЛЬНАЯ ПРОВЕРКА: Запрет на оценку своих промптов
    if (prompt.authorId === session.user.id) {
      console.log('POST /api/ratings - BLOCKED: Author trying to rate own prompt:', {
        authorId: prompt.authorId,
        userId: session.user.id,
        promptId,
        promptTitle: prompt.title
      })
      return NextResponse.json({ 
        error: 'Нельзя оценивать свой собственный промпт',
        details: 'Авторы не могут оценивать свои промпты'
      }, { status: 403 })
    }

    // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убеждаемся что authorId не null/undefined
    if (!prompt.authorId) {
      console.log('POST /api/ratings - prompt has no author:', promptId)
      return NextResponse.json({ error: 'Prompt has no author' }, { status: 400 })
    }

    // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убеждаемся что пользователи разные
    if (prompt.authorId === session.user.id) {
      console.log('POST /api/ratings - DOUBLE CHECK FAILED: Same user as author')
      return NextResponse.json({ 
        error: 'Запрещено оценивать собственные промпты',
        code: 'SELF_RATING_FORBIDDEN'
      }, { status: 403 })
    }

    console.log('POST /api/ratings - author check passed:', {
      authorId: prompt.authorId,
      userId: session.user.id,
      isAuthor: prompt.authorId === session.user.id
    })

    // Запрещаем менять существующую оценку
    const existingRating = await prisma.rating.findUnique({
      where: { userId_promptId: { userId: session.user.id, promptId } },
    })

    if (existingRating) {
      console.log('POST /api/ratings - user already rated this prompt:', existingRating.value)
      // Получаем кэшированные значения рейтинга из БД
      const promptWithRating = await prisma.prompt.findUnique({ 
        where: { id: promptId }, 
        select: { averageRating: true, totalRatings: true } 
      })
      return NextResponse.json({
        promptId,
        average: Number((promptWithRating?.averageRating || 0).toFixed(1)),
        count: promptWithRating?.totalRatings || 0,
        myRating: existingRating.value,
        canRate: false,
      }, { status: 409 })
    }

    console.log('POST /api/ratings - creating new rating')
    await prisma.rating.create({
      data: { value, userId: session.user.id, promptId },
    })

    // Log interaction (rate) if model exists
    if ((prisma as any).promptInteraction?.create) {
      Promise.resolve(
        (prisma as any).promptInteraction.create({ data: { userId: session.user.id, promptId, type: 'rate', weight: value } })
      ).catch(() => {})
    }

    const [count, agg, my] = await Promise.all([
      prisma.rating.count({ where: { promptId } }),
      prisma.rating.aggregate({ where: { promptId }, _avg: { value: true } }),
      prisma.rating.findUnique({ where: { userId_promptId: { userId: session.user.id, promptId } } }),
    ])

    console.log('POST /api/ratings - rating created successfully:', { count, average: agg._avg.value, myRating: my?.value })

    // Обновляем кэшированные значения рейтинга в БД
    const average = Number((agg._avg.value || 0).toFixed(1))
    await prisma.prompt.update({
      where: { id: promptId },
      data: { averageRating: average, totalRatings: count }
    })

    // Запускаем асинхронный пересчет репутации автора (не блокируя ответ)
    if (typeof updateUserReputation === 'function') {
      Promise.resolve(updateUserReputation(prompt.authorId)).catch(() => {})
    }

      return NextResponse.json({
        promptId,
        average: average,
        count: count,
        myRating: my?.value ?? null,
        // После выставления оценку менять нельзя
        canRate: false,
      })
  } catch (e) {
    console.error('POST /api/ratings error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


