import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { SignJWT } from 'jose'

type AdminResult = { ok: true; actor: { id: string; email: string | null } } | { ok: false }

async function requireAdmin(request: NextRequest): Promise<AdminResult> {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  const apiKey = process.env.ADMIN_API_KEY

  if (apiKey && header === `Bearer ${apiKey}`) {
    return { ok: true, actor: { id: 'api-key', email: 'api-key' as string | null } }
  }

  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL
  if (session?.user?.email && adminEmail && session.user.email.toLowerCase() === adminEmail.toLowerCase()) {
    return { ok: true, actor: { id: session.user.id, email: session.user.email } }
  }
  return { ok: false }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, ttlSec } = await request.json()
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const ttl = Math.min(Math.max(Number(ttlSec) || 1800, 60), 3600) // 1–60 минут
  const secret = new TextEncoder().encode(process.env.IMPERSONATION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret')

  const now = Math.floor(Date.now() / 1000)
  const exp = now + ttl

  const actorId = admin.ok ? admin.actor.id : 'unknown'
  const token = await new SignJWT({ act: actorId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setSubject(userId)
    .sign(secret)

  return NextResponse.json({ token, exp })
}


