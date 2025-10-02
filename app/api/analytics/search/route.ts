import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Логируем событие поиска
    console.log('🔍 Search analytics event:', {
      event: body.event,
      properties: body.properties,
      timestamp: new Date().toISOString()
    })
    
    // Здесь можно добавить сохранение в базу данных
    // или отправку в внешнюю аналитику
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    )
  }
}
