import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const requestSchema = z.object({
  cardId: z.string().min(1),
  fingerprint: z.string().trim().min(8).max(128).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    console.log('Simple view-token API called')
    const json = await req.json().catch(() => null)
    if (!json) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }
    
    const parsed = requestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const { cardId, fingerprint } = parsed.data
    console.log('Processing view token for cardId:', cardId)

    // Проверяем, что промпт существует
    const prompt = await prisma.prompt.findUnique({ 
      where: { id: cardId }, 
      select: { id: true } 
    })

    if (!prompt) {
      console.log('Prompt not found for cardId:', cardId)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    console.log('Prompt found, generating simple token...')
    
    // Генерируем простой токен без Redis
    const tokenId = `simple-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const token = `${tokenId}.simple-signature`

    console.log('Simple view token generated:', token)

    return NextResponse.json({
      viewToken: token,
      expiresIn: 600, // 10 минут
    })
  } catch (error) {
    console.error('Simple view-token API error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
