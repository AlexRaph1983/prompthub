import crypto from 'crypto'
import { prisma } from './prisma'
import { getRedis } from './redis'
import { rejectedViewsCounter, updateCardViewsGauge, viewEventsCounter, viewRateLimitedCounter, viewTokenIssuesCounter } from './metrics'

export const VIEW_TOKEN_TTL_SECONDS = 10 * 60
export const VIEW_DEDUP_TTL_SECONDS = 15 * 60
export const AUTH_WINDOW_SECONDS = 8 * 60 * 60
export const GUEST_WINDOW_SECONDS = 24 * 60 * 60

export const VIEW_TOKEN_MAX_AGE_MS = 5 * 60 * 1000
export const GLOBAL_RATE_WINDOW_SECONDS = 60
export const GLOBAL_GUEST_RATE_LIMIT = 12
export const GLOBAL_AUTH_RATE_LIMIT = 60
export const TOKEN_ISSUE_GUEST_WINDOW_SECONDS = 30
export const TOKEN_ISSUE_AUTH_WINDOW_SECONDS = 30
export const TOKEN_ISSUE_GUEST_LIMIT = 20
export const TOKEN_ISSUE_AUTH_LIMIT = 80

export interface ViewTokenMeta {
  promptId: string
  userId?: string | null
  ipHash?: string | null
  uaHash?: string | null
  fpHash?: string | null
  issuedAt: number
}

export interface IssueViewTokenInput {
  promptId: string
  userId?: string | null
  ip?: string | null
  userAgent?: string | null
  fingerprint?: string | null
}

function getSalt() {
  const salt = process.env.VIEW_SALT
  if (!salt) {
    throw new Error('VIEW_SALT must be configured')
  }
  return salt
}

export function computeIpHash(ip?: string | null) {
  if (!ip) return null
  const salt = getSalt()
  return crypto.createHmac('sha256', salt).update(ip.trim()).digest('hex').slice(0, 24)
}

export function computeUaHash(ua?: string | null) {
  if (!ua) return null
  const salt = getSalt()
  return crypto.createHmac('sha256', salt).update(ua.trim()).digest('hex').slice(0, 24)
}

export function normalizeFingerprint(fp?: string | null) {
  if (!fp) return null
  return fp.trim().slice(0, 128)
}

function signTokenId(tokenId: string) {
  const salt = getSalt()
  return crypto.createHmac('sha256', salt).update(tokenId).digest('hex').slice(0, 48)
}

export function buildViewTokenValue(tokenId: string) {
  const signature = signTokenId(tokenId)
  return `${tokenId}.${signature}`
}

export function parseViewToken(token: string) {
  const [tokenId, signature] = token.split('.')
  if (!tokenId || !signature) {
    return null
  }
  const expected = signTokenId(tokenId)
  if (signature.length !== expected.length) {
    return null
  }
  let provided: Buffer
  let expectedBuf: Buffer
  try {
    provided = Buffer.from(signature, 'hex')
    expectedBuf = Buffer.from(expected, 'hex')
  } catch (error) {
    return null
  }
  if (provided.length !== expectedBuf.length) {
    return null
  }
  if (!crypto.timingSafeEqual(provided, expectedBuf)) {
    return null
  }
  return tokenId
}

export async function issueViewToken(input: IssueViewTokenInput) {
  const redis = await getRedis()
  const tokenId = crypto.randomUUID()
  const meta: ViewTokenMeta = {
    promptId: input.promptId,
    userId: input.userId ?? null,
    ipHash: computeIpHash(input.ip),
    uaHash: computeUaHash(input.userAgent),
    fpHash: normalizeFingerprint(input.fingerprint),
    issuedAt: Date.now(),
  }
  const key = `viewtoken:${tokenId}`
  await (redis as any).set(key, JSON.stringify(meta), 'EX', VIEW_TOKEN_TTL_SECONDS)
  return { token: buildViewTokenValue(tokenId), meta }
}

export async function readViewToken(token: string) {
  const redis = await getRedis()
  const tokenId = parseViewToken(token)
  if (!tokenId) {
    viewTokenIssuesCounter.add(1, { reason: 'INVALID_SIGNATURE' })
    return { success: false as const, reason: 'INVALID_SIGNATURE' as const }
  }
  const key = `viewtoken:${tokenId}`
  const raw = await redis.get(key)
  if (!raw) {
    viewTokenIssuesCounter.add(1, { reason: 'NOT_FOUND' })
    return { success: false as const, reason: 'NOT_FOUND' as const }
  }
  let meta: ViewTokenMeta | null = null
  try {
    meta = JSON.parse(raw) as ViewTokenMeta
  } catch (error) {
    viewTokenIssuesCounter.add(1, { reason: 'CORRUPT' })
    await redis.del(key)
    return { success: false as const, reason: 'CORRUPT' as const }
  }
  return { success: true as const, tokenId, meta }
}

export async function invalidateViewToken(tokenId: string) {
  const redis = await getRedis()
  await redis.del(`viewtoken:${tokenId}`)
}


export function buildAuthRateLimitKey(userId: string, promptId: string) {
  return `view:auth:${userId}:${promptId}`
}

export async function incrementPromptViews(promptId: string) {
  const updated = await prisma.prompt.update({
    where: { id: promptId },
    data: { views: { increment: 1 } },
    select: { id: true, views: true },
  })
  viewEventsCounter.add(1, { counted: 'true' })
  updateCardViewsGauge([{ id: updated.id, views: updated.views }])
  return updated.views
}

export async function recordPromptViewEvent({
  promptId,
  userId,
  ipHash,
  uaHash,
  fpHash,
  viewTokenId,
  isCounted,
  reason,
}: {
  promptId: string
  userId?: string | null
  ipHash?: string | null
  uaHash?: string | null
  fpHash?: string | null
  viewTokenId?: string | null
  isCounted: boolean
  reason?: string | null
}) {
  await prisma.promptViewEvent.create({
    data: {
      promptId,
      userId,
      ipHash,
      uaHash,
      fpHash,
      viewTokenId,
      isCounted,
      reason,
    },
  })
  if (!isCounted) {
    rejectedViewsCounter.add(1, { reason: reason ?? 'UNKNOWN' })
  }
}

export async function markDuplicateDedupKey(tokenId: string) {
  const redis = await getRedis()
  const key = `dedup:view:${tokenId}`
  const inserted = await (redis as any).set(key, '1', 'NX', 'EX', VIEW_DEDUP_TTL_SECONDS)
  return inserted === 'OK'
}

export async function applyRateLimit(meta: ViewTokenMeta) {

  const redis = await getRedis()



  if (meta.userId) {

    const promptKey = buildAuthRateLimitKey(meta.userId, meta.promptId)

    const promptStored = await (redis as any).set(promptKey, '1', 'NX', 'EX', AUTH_WINDOW_SECONDS)

    if (promptStored !== 'OK') {

      viewRateLimitedCounter.add(1, { type: 'auth_prompt' })

      return { allowed: false as const, reason: 'RL_AUTH' as const }

    }



    const authGlobalKey = `view:auth:global:${meta.userId}`

    const authCount = await redis.incr(authGlobalKey)

    if (authCount === 1) {

      await redis.expire(authGlobalKey, GLOBAL_RATE_WINDOW_SECONDS)

    }

    if (authCount > GLOBAL_AUTH_RATE_LIMIT) {

      viewRateLimitedCounter.add(1, { type: 'auth_global' })

      return { allowed: false as const, reason: 'RL_AUTH_GLOBAL' as const }

    }



    return { allowed: true as const }

  }



  const guestKeys: Array<{ key: string; reason: 'RL_GUEST_FP' | 'RL_GUEST_IPUA' | 'RL_GUEST_IP' }> = []

  if (meta.fpHash) {

    guestKeys.push({

      key: `view:guest:fp:${meta.fpHash}:${meta.promptId}`,

      reason: 'RL_GUEST_FP',

    })

  }

  if (meta.ipHash || meta.uaHash) {

    guestKeys.push({

      key: `view:guest:ipua:${meta.ipHash ?? 'null'}:${meta.uaHash ?? 'null'}:${meta.promptId}`,

      reason: 'RL_GUEST_IPUA',

    })

  }

  if (meta.ipHash) {

    guestKeys.push({

      key: `view:guest:ip:${meta.ipHash}:${meta.promptId}`,

      reason: 'RL_GUEST_IP',

    })

  }



  let failedReason: 'RL_GUEST_FP' | 'RL_GUEST_IPUA' | 'RL_GUEST_IP' | null = null

  for (const entry of guestKeys) {

    const stored = await (redis as any).set(entry.key, '1', 'NX', 'EX', GUEST_WINDOW_SECONDS)

    if (stored !== 'OK') {

      failedReason = entry.reason

      break

    }

  }



  if (failedReason) {

    viewRateLimitedCounter.add(1, { type: failedReason.toLowerCase() })

    return { allowed: false as const, reason: failedReason }

  }



  const anchor = meta.ipHash ?? meta.uaHash ?? meta.fpHash ?? 'unknown'

  const globalKey = `view:guest:global:${anchor}`

  const guestCount = await redis.incr(globalKey)

  if (guestCount === 1) {

    await redis.expire(globalKey, GLOBAL_RATE_WINDOW_SECONDS)

  }

  if (guestCount > GLOBAL_GUEST_RATE_LIMIT) {

    viewRateLimitedCounter.add(1, { type: 'guest_global' })

    return { allowed: false as const, reason: 'RL_GUEST_GLOBAL' as const }

  }



  return { allowed: true as const }

}



export async function ensureCanIssueViewToken({ userId, ip, userAgent, fingerprint }: { userId?: string | null; ip?: string | null; userAgent?: string | null; fingerprint?: string | null }) {

  const redis = await getRedis()



  if (userId) {

    const authKey = `viewtoken:issue:auth:${userId}`

    const attempts = await redis.incr(authKey)

    if (attempts === 1) {

      await redis.expire(authKey, TOKEN_ISSUE_AUTH_WINDOW_SECONDS)

    }

    if (attempts > TOKEN_ISSUE_AUTH_LIMIT) {

      viewRateLimitedCounter.add(1, { type: 'auth_issue' })

      return { allowed: false as const, reason: 'ISSUE_RL_AUTH' as const }

    }

    return { allowed: true as const }

  }



  const fpHash = normalizeFingerprint(fingerprint)

  const ipHash = computeIpHash(ip ?? undefined)

  const uaHash = computeUaHash(userAgent ?? undefined)

  const anchor = fpHash ?? ipHash ?? uaHash ?? 'unknown'

  const guestKey = `viewtoken:issue:guest:${anchor}`

  const attempts = await redis.incr(guestKey)

  if (attempts === 1) {

    await redis.expire(guestKey, TOKEN_ISSUE_GUEST_WINDOW_SECONDS)

  }

  if (attempts > TOKEN_ISSUE_GUEST_LIMIT) {

    viewRateLimitedCounter.add(1, { type: 'guest_issue' })

    return { allowed: false as const, reason: 'ISSUE_RL_GUEST' as const }

  }



  return { allowed: true as const }

}




export async function refreshGaugeSnapshot() {
  const prompts = await prisma.prompt.findMany({ select: { id: true, views: true } })
  updateCardViewsGauge(prompts.map((p) => ({ id: p.id, views: p.views })))
}


