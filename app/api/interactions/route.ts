import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null)
    if (!session?.user?.id) return NextResponse.json({ ok: true, skipped: 'anonymous' })
    const { promptId, type, weight } = await req.json()
    if (!promptId || !type) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    await prisma.promptInteraction.create({
      data: {
        userId: session.user.id,
        promptId,
        type: String(type).toLowerCase(),
        weight: typeof weight === 'number' && isFinite(weight) ? weight : 1,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    // non-fatal
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}


