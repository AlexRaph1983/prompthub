import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto from 'crypto'
import { processSearchQuery } from '@/lib/search-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, queryHash, resultsCount, clickedResult, sessionId } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'Query is required',
        reason: 'MISSING_QUERY'
      }, { status: 400 })
    }

    // Получаем информацию о пользователе
    const session = await auth()
    const userId = session?.user?.id || null

    // Создаем хэш IP для анонимных пользователей
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const ipHash = crypto.createHash('sha256').update(clientIp + process.env.NEXTAUTH_SECRET).digest('hex').substring(0, 16)

    // Обрабатываем запрос с валидацией
    const processed = processSearchQuery(query, userId, ipHash)
    
    if (!processed.valid) {
      console.log(`❌ Invalid search query rejected: ${processed.reason}`, { query, userId, ipHash })
      return NextResponse.json({ 
        error: processed.reason,
        reason: 'INVALID_QUERY'
      }, { status: 400 })
    }

    // Проверяем дедупликацию по хэшу
    const existingQuery = await prisma.searchQuery.findFirst({
      where: {
        queryHash: processed.hash,
        userId: userId || null,
        ipHash: userId ? null : ipHash,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 минут
        }
      }
    })

    if (existingQuery) {
      console.log(`⚠️ Duplicate search query detected: ${processed.processed}`)
      return NextResponse.json({ 
        error: 'Duplicate query',
        reason: 'DUPLICATE_QUERY'
      }, { status: 409 })
    }

    const userAgent = request.headers.get('user-agent') || null

    // Сохраняем поисковый запрос
    await prisma.searchQuery.create({
      data: {
        query: processed.processed,
        queryHash: processed.hash,
        userId,
        ipHash: userId ? null : ipHash,
        userAgent,
        resultsCount: resultsCount || 0,
        clickedResult,
        sessionId,
      },
    })

    console.log(`✅ Search query tracked: ${processed.processed}`)
    return NextResponse.json({ 
      success: true,
      processed: processed.processed,
      hash: processed.hash
    })
  } catch (error) {
    console.error('Error tracking search query:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      reason: 'SERVER_ERROR'
    }, { status: 500 })
  }
}
