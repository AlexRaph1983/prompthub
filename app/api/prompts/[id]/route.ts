import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authFromRequest } from '@/lib/auth'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    })
    if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(prompt)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await authFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.prompt.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updatable: any = {}
    for (const key of ['title', 'description', 'prompt', 'model', 'lang', 'category', 'tags', 'license']) {
      if (typeof body[key] !== 'undefined') updatable[key] = body[key]
    }

    const updated = await prisma.prompt.update({ where: { id: params.id }, data: updatable })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


