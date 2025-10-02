import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto from 'crypto'
import { validateSearchQuery, createQueryHash } from '@/lib/search-validation'
import { incrementSavedCount, incrementRejectedCount } from '@/lib/search-metrics'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('❌ JSON parsing error:', jsonError)
      return NextResponse.json({ 
        error: 'Invalid JSON',
        reason: 'INVALID_JSON'
      }, { status: 400 })
    }
    
    const { query, resultsCount, clickedResult, sessionId, finished } = body

    // Получаем информацию о пользователе
    const session = await auth()
    const userId = session?.user?.id || null

    // Создаем хэш IP для анонимных пользователей
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const ipHash = crypto.createHash('sha256').update(clientIp + process.env.NEXTAUTH_SECRET).digest('hex').substring(0, 16)

    // Валидация с новыми правилами
    const validation = validateSearchQuery(query, finished)
    
    if (!validation.valid) {
      console.log(`❌ Search query rejected: ${validation.reason}`, { 
        query, 
        userId, 
        ipHash, 
        finished,
        metrics: validation.metrics 
      })
      
      // Обновляем метрики отклонения
      await incrementRejectedCount(validation.reason!)
      
      return NextResponse.json({ 
        error: validation.reason,
        reason: validation.reason,
        metrics: validation.metrics
      }, { status: 400 })
    }

    // Создаем хэш для дедупликации
    const queryHash = createQueryHash(validation.normalizedQuery!, userId, ipHash)

    // Проверяем дедупликацию по хэшу
    const existingQuery = await prisma.searchQuery.findFirst({
      where: {
        queryHash,
        userId: userId || null,
        ipHash: userId ? null : ipHash,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 минут
        }
      }
    })

    if (existingQuery) {
      console.log(`⚠️ Duplicate search query detected: ${validation.normalizedQuery}`)
      await incrementRejectedCount('DUPLICATE_QUERY')
      
      return NextResponse.json({ 
        error: 'Duplicate query',
        reason: 'DUPLICATE_QUERY'
      }, { status: 409 })
    }

    const userAgent = request.headers.get('user-agent') || null

    // Сохраняем поисковый запрос
    await prisma.searchQuery.create({
      data: {
        query: validation.normalizedQuery!,
        queryHash,
        userId,
        ipHash: userId ? null : ipHash,
        userAgent,
        resultsCount: resultsCount || 0,
        clickedResult,
        sessionId,
      },
    })

    // Обновляем метрики сохранения
    await incrementSavedCount()

    console.log(`✅ Search query tracked: ${validation.normalizedQuery}`)
    return NextResponse.json({ 
      success: true,
      processed: validation.normalizedQuery,
      hash: queryHash,
      metrics: validation.metrics
    })
  } catch (error) {
    console.error('Error tracking search query:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      reason: 'SERVER_ERROR'
    }, { status: 500 })
  }
}
