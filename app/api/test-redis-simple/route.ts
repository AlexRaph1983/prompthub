import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing Redis import...')
    
    // Пробуем импортировать Redis
    const { getRedis } = await import('@/lib/redis')
    console.log('Redis module imported')
    
    const redis = await getRedis()
    console.log('Redis connected:', typeof redis)
    
    // Простая операция
    await redis.set('test-simple', 'value', 'EX', 60)
    const value = await redis.get('test-simple')
    
    return NextResponse.json({ 
      success: true, 
      redisType: typeof redis,
      testValue: value,
      message: 'Redis works!'
    })
  } catch (error) {
    console.error('Redis test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
