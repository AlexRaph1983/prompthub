import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { RecoMetrics } from '@/lib/metrics/recommendations'
import { z } from 'zod'

/**
 * POST /api/recommendations/events
 * 
 * Логирование событий рекомендаций для CTR метрик:
 * - impression: показ рекомендаций пользователю
 * - click: клик на рекомендованный промпт
 * - copy: копирование рекомендованного промпта
 */

const eventSchema = z.object({
  type: z.enum(['impression', 'click', 'copy']),
  promptId: z.string().optional(),
  promptIds: z.array(z.string()).optional(),
  position: z.number().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null)
    const userId = session?.user?.id || 'anonymous'
    
    const body = await req.json()
    const parsed = eventSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    
    const { type, promptId, promptIds, position, metadata } = parsed.data
    
    switch (type) {
      case 'impression':
        if (promptIds && promptIds.length > 0) {
          RecoMetrics.impression({ userId, promptIds })
        }
        break
        
      case 'click':
        if (promptId) {
          RecoMetrics.click({ userId, promptId, position: position ?? 0 })
        }
        break
        
      case 'copy':
        if (promptId) {
          RecoMetrics.copy({ userId, promptId, position: position ?? 0 })
        }
        break
    }
    
    logger.debug({
      event: `reco.${type}`,
      userId,
      promptId,
      promptIds,
      position,
      metadata,
    }, `Recommendation event: ${type}`)
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    logger.error({ error }, 'POST /api/recommendations/events error')
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}


