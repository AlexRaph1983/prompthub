import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import crypto from 'crypto'
import { incrementPromptStats } from '@/lib/services/dailyStatsService'

export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null)
    const { promptId, type, weight } = await req.json()
    if (!promptId || !type) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    // Build stable actor id: real user id or anonymous fingerprint
    let actorId: string | null = session?.user?.id ?? null
    if (!actorId) {
      const ua = req.headers.get('user-agent') || ''
      const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || (req as any).ip || ''
      const fp = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32)
      actorId = `anon:${fp}`
    }

    await prisma.promptInteraction.create({
      data: {
        userId: actorId,
        promptId,
        type: String(type).toLowerCase(),
        weight: typeof weight === 'number' && isFinite(weight) ? weight : 1,
      },
    })

    if (String(type).toLowerCase() === 'copy') {
      await incrementPromptStats({ promptId, type: 'copy' })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    // non-fatal
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}


