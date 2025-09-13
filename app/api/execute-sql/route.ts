import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
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

