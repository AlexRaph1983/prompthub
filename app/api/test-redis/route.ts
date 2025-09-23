import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export async function GET() {
  try {
    console.log('Testing Redis connection...')
    const redis = await getRedis()
    console.log('Redis connected:', typeof redis)
    
    await redis.set('test-key', 'test-value', 'EX', 60)
    const value = await redis.get('test-key')
    
    return NextResponse.json({ 
      success: true, 
      redisType: typeof redis,
      testValue: value 
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
