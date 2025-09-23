import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Testing Prisma connection...')
    const prompt = await prisma.prompt.findFirst({
      select: { id: true, title: true }
    })
    
    return NextResponse.json({ 
      success: true, 
      prompt: prompt,
      message: 'Prisma works!'
    })
  } catch (error) {
    console.error('Prisma test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
