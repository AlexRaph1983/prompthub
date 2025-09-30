import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { onViewsUpdated } from '@/lib/viewsIntegration'
import { AntifraudEngine, AntifraudContext } from '@/lib/antifraud'

const requestSchema = z.object({
  cardId: z.string().min(1),
  viewToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    console.log('Track-view API called')
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

    // Проверка антифрода
    const antifraudContext: AntifraudContext = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      fingerprint: req.headers.get('x-fingerprint') || undefined,
      userId: req.headers.get('x-user-id') || undefined,
      promptId: cardId,
      referer: req.headers.get('referer') || undefined,
      acceptLanguage: req.headers.get('accept-language') || undefined,
      timestamp: Date.now()
    }

    const antifraudResult = await AntifraudEngine.check(antifraudContext)
    
    if (!antifraudResult.allowed) {
      console.log('Antifraud check failed:', antifraudResult.reason)
      return NextResponse.json({ 
        error: 'ANTIFRAUD_BLOCKED', 
        reason: antifraudResult.reason,
        confidence: antifraudResult.confidence
      }, { status: 403 })
    }

    console.log('Prompt found, incrementing views...')
    
    // Инкрементируем просмотры
    const updated = await prisma.prompt.update({
      where: { id: cardId },
      data: { views: { increment: 1 } },
      select: { views: true }
    })

    console.log('Views incremented to:', updated.views)

    // Интеграция с системой рейтингов и рекомендаций
    Promise.resolve(onViewsUpdated(cardId, updated.views)).catch(error => {
      console.error('Views integration failed:', error)
    })

    return NextResponse.json({
      counted: true,
      views: updated.views,
    })
  } catch (error) {
    console.error('Track-view API error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}