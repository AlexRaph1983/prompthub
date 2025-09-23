import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { extractRequestIdentity } from '@/lib/requestContext'
import type { ViewTokenMeta } from '@/lib/promptViewService'
import * as promptViewService from '@/lib/promptViewService'
import { viewEventsCounter } from '@/lib/metrics'
import { AntifraudEngine, createAntifraudAlert } from '@/lib/antifraud'

const {
  applyRateLimit,
  computeIpHash,
  computeUaHash,
  incrementPromptViews,
  invalidateViewToken,
  markDuplicateDedupKey,
  readViewToken,
  recordPromptViewEvent,
  VIEW_TOKEN_MAX_AGE_MS,
} = promptViewService

const schema = z.object({
  cardId: z.string().min(1),
  viewToken: z.string().min(32),
})

export async function POST(req: NextRequest) {
  const started = Date.now()
  const identity = extractRequestIdentity(req)
  const session = await auth().catch(() => null)

  try {
    const json = await req.json().catch(() => null)
    if (!json) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const { cardId, viewToken } = parsed.data

    const lookup = await readViewToken(viewToken)
    if (!lookup.success) {
      logger.warn({ route: 'track-view', reason: lookup.reason }, 'View token rejected')
      return NextResponse.json({ counted: false, reason: lookup.reason }, { status: 400 })
    }

    const { tokenId, meta } = lookup

    if (meta.promptId !== cardId) {
      await recordPromptViewEvent({
        promptId: meta.promptId,
        userId: meta.userId,
        ipHash: meta.ipHash,
        uaHash: meta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'BAD_TOKEN_CARD',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'BAD_TOKEN' })
      return NextResponse.json({ counted: false, reason: 'BAD_TOKEN' }, { status: 400 })
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: cardId }, select: { id: true, authorId: true } })
    if (!prompt) {
      await invalidateViewToken(tokenId)
      return NextResponse.json({ counted: false, reason: 'NOT_FOUND' }, { status: 404 })
    }
    if (typeof meta.issuedAt !== 'number' || Number.isNaN(meta.issuedAt)) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: meta.ipHash,
        uaHash: meta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'TOKEN_CORRUPT',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'TOKEN_CORRUPT' })
      return NextResponse.json({ counted: false, reason: 'TOKEN_CORRUPT' }, { status: 400 })
    }

    const tokenAge = Date.now() - meta.issuedAt
    if (tokenAge > VIEW_TOKEN_MAX_AGE_MS) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: meta.ipHash,
        uaHash: meta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'TOKEN_STALE',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'TOKEN_STALE' })
      return NextResponse.json({ counted: false, reason: 'TOKEN_STALE' }, { status: 400 })
    }

    const currentIpHash = identity.ip ? computeIpHash(identity.ip) : null
    const currentUaHash = identity.userAgent ? computeUaHash(identity.userAgent) : null

    if (!meta.fpHash && !meta.ipHash && !meta.uaHash && !currentIpHash && !currentUaHash) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: null,
        uaHash: null,
        fpHash: null,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'IDENTITY_MISSING',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'IDENTITY_MISSING' })
      return NextResponse.json({ counted: false, reason: 'IDENTITY_MISSING' }, { status: 400 })
    }

    if (meta.ipHash && currentIpHash && meta.ipHash !== currentIpHash) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: currentIpHash,
        uaHash: meta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'BAD_TOKEN_IP',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'BAD_TOKEN_IP' })
      return NextResponse.json({ counted: false, reason: 'BAD_TOKEN' }, { status: 400 })
    }

    if (meta.uaHash && currentUaHash && meta.uaHash !== currentUaHash) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: meta.ipHash,
        uaHash: currentUaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'BAD_TOKEN_UA',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'BAD_TOKEN_UA' })
      return NextResponse.json({ counted: false, reason: 'BAD_TOKEN' }, { status: 400 })
    }

    const effectiveMeta = {
      ...meta,
      ipHash: meta.ipHash ?? currentIpHash ?? null,
      uaHash: meta.uaHash ?? currentUaHash ?? null,
    }

    if (meta.userId && session?.user?.id && meta.userId !== session.user.id) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session.user.id,
        ipHash: effectiveMeta.ipHash,
        uaHash: effectiveMeta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'TOKEN_MISMATCH',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'TOKEN_MISMATCH' })
      return NextResponse.json({ counted: false, reason: 'BAD_TOKEN' }, { status: 400 })
    }

    const isAuthor = (session?.user?.id || meta.userId) === prompt.authorId
    // Исключаем системных пользователей из блокировки SELF_VIEW
    const isSystemUser = prompt.authorId === 'promptmaster' || prompt.authorId === 'suno-master-001'
    if (isAuthor && !isSystemUser) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: effectiveMeta.ipHash,
        uaHash: effectiveMeta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'SELF_VIEW',
      })
      await invalidateViewToken(tokenId)
      viewEventsCounter.add(1, { counted: 'false', reason: 'SELF_VIEW' })
      return NextResponse.json({ counted: false, reason: 'SELF_VIEW' })
    }
    const antifraudResult = await AntifraudEngine.check({
      ip: identity.ip ?? undefined,
      userAgent: identity.userAgent ?? undefined,
      fingerprint: meta.fpHash ?? undefined,
      userId: session?.user?.id ?? meta.userId ?? undefined,
      promptId: cardId,
      referer: identity.referer ?? undefined,
      acceptLanguage: identity.acceptLanguage ?? undefined,
      timestamp: Date.now(),
    })

    if (!antifraudResult.allowed) {
      const antifraudReason = antifraudResult.reason ?? 'ANTIFRAUD_BLOCKED'
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: effectiveMeta.ipHash,
        uaHash: effectiveMeta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: antifraudReason,
      })
      viewEventsCounter.add(1, { counted: 'false', reason: antifraudReason })
      await invalidateViewToken(tokenId)

      if (antifraudResult.confidence >= 0.85) {
        const severity = antifraudResult.confidence >= 0.95 ? 'CRITICAL' : 'HIGH'
        await createAntifraudAlert(
          'TRACK_VIEW_BLOCKED',
          severity,
          'Blocked suspect view for prompt ' + cardId,
          {
            promptId: cardId,
            userId: session?.user?.id ?? meta.userId ?? null,
            reason: antifraudReason,
            ...(antifraudResult.metadata ?? {}),
          },
        )
      }

      return NextResponse.json({ counted: false, reason: antifraudReason }, { status: 202 })
    }

    const dedupInserted = await markDuplicateDedupKey(tokenId)
    if (!dedupInserted) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: effectiveMeta.ipHash,
        uaHash: effectiveMeta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: 'DUPLICATE',
      })
      viewEventsCounter.add(1, { counted: 'false', reason: 'DUPLICATE' })
      await invalidateViewToken(tokenId)
      return NextResponse.json({ counted: false, reason: 'DUPLICATE' })
    }

    const rate = await applyRateLimit(effectiveMeta as ViewTokenMeta)
    if (!rate.allowed) {
      await recordPromptViewEvent({
        promptId: cardId,
        userId: session?.user?.id ?? meta.userId,
        ipHash: effectiveMeta.ipHash,
        uaHash: effectiveMeta.uaHash,
        fpHash: meta.fpHash,
        viewTokenId: tokenId,
        isCounted: false,
        reason: rate.reason,
      })
      viewEventsCounter.add(1, { counted: 'false', reason: rate.reason ?? 'RATE_LIMIT' })
      await invalidateViewToken(tokenId)
      return NextResponse.json({ counted: false, reason: rate.reason }, { status: 200 })
    }

    const newViews = await incrementPromptViews(cardId)
    await recordPromptViewEvent({
      promptId: cardId,
      userId: session?.user?.id ?? meta.userId,
      ipHash: effectiveMeta.ipHash,
      uaHash: effectiveMeta.uaHash,
      fpHash: meta.fpHash,
      viewTokenId: tokenId,
      isCounted: true,
    })

    await invalidateViewToken(tokenId)
    viewEventsCounter.add(1, { counted: 'true', reason: 'OK' })

    logger.info(
      {
        route: 'track-view',
        cardId,
        userId: session?.user?.id ?? meta.userId,
        duration: Date.now() - started,
      },
      'Counted prompt view',
    )

    return NextResponse.json({ counted: true, views: newViews })
  } catch (error) {
    logger.error({ route: 'track-view', error }, 'Failed to track view')
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}








