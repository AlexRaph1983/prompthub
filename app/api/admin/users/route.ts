import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

async function requireAdmin(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('query') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  const mapped = items.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.email && u.email.toLowerCase() === adminEmail ? 'admin' : 'user',
  }))

  return NextResponse.json({ items: mapped, total })
}


