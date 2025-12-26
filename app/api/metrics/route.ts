import { NextRequest, NextResponse } from 'next/server'
import { metricsRegistry } from '@/lib/metrics/recommendations'

export const dynamic = 'force-dynamic'

/**
 * GET /api/metrics
 * Prometheus-совместимый endpoint для метрик
 */
export async function GET(req: NextRequest) {
  // Простая защита - можно добавить API key
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.METRICS_API_TOKEN
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  const metrics = metricsRegistry.export()
  
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}


