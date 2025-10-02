import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, resultsCount, clickedResult, sessionId } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Фильтруем слишком короткие запросы (меньше 3 символов)
    if (query.trim().length < 3) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 })
    }

    // Получаем информацию о пользователе
    const session = await auth()
    const userId = session?.user?.id || null

    // Создаем хэш IP для анонимных пользователей
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const ipHash = crypto.createHash('sha256').update(clientIp + process.env.NEXTAUTH_SECRET).digest('hex').substring(0, 16)

    const userAgent = request.headers.get('user-agent') || null

    // Сохраняем поисковый запрос
    await prisma.searchQuery.create({
      data: {
        query: query.trim().toLowerCase(),
        userId,
        ipHash: userId ? null : ipHash, // Сохраняем IP хэш только для анонимных пользователей
        userAgent,
        resultsCount: resultsCount || 0,
        clickedResult,
        sessionId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking search query:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
