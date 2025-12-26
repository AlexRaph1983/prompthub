import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { recordInteraction, InteractionType, logAudit } from '@/lib/services/interactionService'
import { incrementPromptStats } from '@/lib/services/dailyStatsService'
import { logger } from '@/lib/logger'
import { trace, SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('prompthub-interactions')

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()
  
  return tracer.startActiveSpan('interaction.record', async (span) => {
    try {
      const session = await auth().catch(() => null)
      const body = await req.json()
      const { promptId, type, weight } = body
      
      span.setAttributes({
        'interaction.promptId': promptId || '',
        'interaction.type': type || '',
        'interaction.userId': session?.user?.id || 'anonymous',
      })
      
      if (!promptId || !type) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid payload' })
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      }
      
      // Получаем контекст запроса
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 
                 req.headers.get('x-real-ip') || ''
      const userAgent = req.headers.get('user-agent') || ''
      
      // Записываем через защищённый сервис
      const result = await recordInteraction(
        {
          promptId,
          type: type.toLowerCase() as InteractionType,
          userId: session?.user?.id,
          weight: typeof weight === 'number' && isFinite(weight) ? weight : undefined,
        },
        {
          ip,
          userAgent,
          requestId,
        }
      )
      
      if (!result.success) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: result.reason })
        
        if (result.rateLimited) {
          return NextResponse.json(
            { ok: false, error: result.reason, rateLimited: true },
            { status: 429 }
          )
        }
        
        return NextResponse.json({ ok: false, error: result.reason }, { status: 200 })
      }
      
      // Обновляем daily stats для copy
      if (type.toLowerCase() === 'copy') {
        await incrementPromptStats({ promptId, type: 'copy' })
      }
      
      // Логируем время выполнения
      const elapsed = Date.now() - startTime
      logger.info({
        requestId,
        event: 'interaction.processed',
        promptId,
        type,
        userId: session?.user?.id || 'anonymous',
        elapsedMs: elapsed,
      }, `Interaction recorded in ${elapsed}ms`)
      
      span.setStatus({ code: SpanStatusCode.OK })
      return NextResponse.json({ ok: true, id: result.interaction?.id })
      
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) })
      logger.error({ error, requestId }, 'POST /api/interactions error')
      return NextResponse.json({ ok: false }, { status: 200 })
    } finally {
      span.end()
    }
  })
}
