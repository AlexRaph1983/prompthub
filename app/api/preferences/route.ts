import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) return NextResponse.json({ categories: [], models: [], languages: [], tags: [] })
  const pref = await prisma.userPreference.findUnique({ where: { userId: session.user.id } })
  const parse = (x: any) => {
    try { return Array.isArray(x) ? x : JSON.parse(x || '[]') } catch { return [] }
  }
  return NextResponse.json({
    categories: parse(pref?.categories),
    models: parse(pref?.models),
    languages: parse(pref?.languages),
    tags: parse(pref?.tags),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const stringify = (a: any) => {
    try { return JSON.stringify(Array.isArray(a) ? a : []) } catch { return '[]' }
  }
  const data = {
    categories: stringify(body.categories),
    models: stringify(body.models),
    languages: stringify(body.languages),
    tags: stringify(body.tags),
  }
  await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })
  return NextResponse.json({ ok: true })
}


