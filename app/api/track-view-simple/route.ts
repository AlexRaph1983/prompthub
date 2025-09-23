import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const requestSchema = z.object({
  cardId: z.string().min(1),
  viewToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    console.log('Simple track-view API called')
    const json = await req.json().catch(() => null)
    if (!json) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }
    
    const parsed = requestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const { cardId, viewToken } = parsed.data
    console.log('Processing track view for cardId:', cardId, 'token:', viewToken)

    // Проверяем, что промпт существует
    const prompt = await prisma.prompt.findUnique({ 
      where: { id: cardId }, 
      select: { id: true, views: true, authorId: true } 
    })

    if (!prompt) {
      console.log('Prompt not found for cardId:', cardId)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    console.log('Prompt found, incrementing views...')
    
    // Инкрементируем просмотры
    const updated = await prisma.prompt.update({
      where: { id: cardId },
      data: { views: { increment: 1 } },
      select: { views: true }
    })

    console.log('Views incremented to:', updated.views)

    return NextResponse.json({
      counted: true,
      views: updated.views,
    })
  } catch (error) {
    console.error('Simple track-view API error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
