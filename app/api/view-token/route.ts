import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { extractRequestIdentity } from '@/lib/requestContext'
import { issueViewToken, VIEW_TOKEN_TTL_SECONDS, ensureCanIssueViewToken } from '@/lib/promptViewService'

const requestSchema = z.object({
  cardId: z.string().min(1),
  fingerprint: z.string().trim().min(8).max(128).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const started = Date.now()
  try {
    const json = await req.json().catch(() => null)
    if (!json) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }
    const parsed = requestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const { cardId, fingerprint } = parsed.data

    const [session, prompt] = await Promise.all([
      auth().catch(() => null),
      prisma.prompt.findUnique({ where: { id: cardId }, select: { id: true } }),
    ])

    if (!prompt) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const identity = extractRequestIdentity(req)
    const guard = await ensureCanIssueViewToken({
      userId: session?.user?.id ?? null,
      ip: identity.ip ?? undefined,
      userAgent: identity.userAgent ?? undefined,
      fingerprint: fingerprint ?? null,
    })
    if (!guard.allowed) {
      logger.warn({ route: 'view-token', cardId, reason: guard.reason }, 'View token issue rate-limited')
      return NextResponse.json({ error: guard.reason }, { status: 429 })
    }

    const { token, meta } = await issueViewToken({
      promptId: cardId,
      userId: session?.user?.id ?? null,
      fingerprint: fingerprint ?? null,
      ip: identity.ip,
      userAgent: identity.userAgent,
    })

    logger.info(
      {
        route: 'view-token',
        cardId,
        duration: Date.now() - started,
        hasFingerprint: Boolean(fingerprint),
        ipHash: meta.ipHash,
        uaHash: meta.uaHash,
        userId: meta.userId,
      },
      'Issued view token',
    )

    return NextResponse.json({
      viewToken: token,
      expiresIn: VIEW_TOKEN_TTL_SECONDS,
    })
  } catch (error) {
    logger.error({ route: 'view-token', error }, 'Failed to issue view token')
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
