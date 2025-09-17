import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }

    // Выполняем SQL запрос
    const result = await prisma.$executeRawUnsafe(sql)

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'SQL executed successfully'
    })

  } catch (error) {
    console.error('SQL execution error:', error)
    return NextResponse.json({ 
      error: 'SQL execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

