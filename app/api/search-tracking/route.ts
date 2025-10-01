import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Search tracking API called')
    
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { query, resultsCount, clickedResult, sessionId } = body

    if (!query || typeof query !== 'string') {
      console.log('❌ Invalid query:', query)
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Получаем информацию о пользователе
    const session = await auth()
    const userId = session?.user?.id || null
    console.log('👤 User ID:', userId)

    // Создаем хэш IP для анонимных пользователей
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const ipHash = crypto.createHash('sha256').update(clientIp + secret).digest('hex').substring(0, 16)

    const userAgent = request.headers.get('user-agent') || null

    console.log('💾 Saving search query:', { query, userId, resultsCount })

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

    console.log('✅ Search query saved successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error tracking search query:', error)
    console.error('❌ Error details:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
