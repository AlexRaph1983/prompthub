import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('🔍 Диагностический API: проверяем данные промптов')
    
    const rows = await prisma.prompt.findMany({
      // БЕЗ select — вернуть все колонки модели
      take: 5,
      orderBy: { updatedAt: 'desc' }
    })
    
    console.log(`Найдено промптов: ${rows.length}`)
    
    // Диагностическая мета: длины крупных полей
    const shaped = rows.map(r => ({
      id: r.id,
      title: r.title ?? null,
      titleLen: r.title?.length ?? 0,
      description: r.description ?? null,
      descLen: r.description?.length ?? 0,
      prompt: r.prompt ?? null,
      promptLen: r.prompt?.length ?? 0,
      sampleText: r.prompt?.slice(0, 120) ?? null,
      model: r.model,
      lang: r.lang,
      category: r.category,
      tags: r.tags,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }))
    
    console.log('Диагностические данные:', shaped)
    
    return NextResponse.json({ 
      ok: true, 
      count: rows.length, 
      shaped,
      raw: rows // Полные данные для проверки
    })
  } catch (e: any) {
    console.error('❌ Ошибка в диагностическом API:', e.message)
    return NextResponse.json({ 
      ok: false, 
      error: e.message 
    }, { status: 500 })
  }
}
