import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma, createPromptAndSync } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompts } = await request.json()

    if (!Array.isArray(prompts)) {
      return NextResponse.json({ error: 'Prompts must be an array' }, { status: 400 })
    }

    // Проверяем, существует ли пользователь в БД
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.log('User not found in DB, creating...')
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          image: (session.user as any).image ?? null,
        }
      })
      console.log('User created:', user)
    }

    const createdPrompts = []

    // Используем createPromptAndSync для автоматического обновления счётчиков
    for (const promptData of prompts) {
      const prompt = await createPromptAndSync({
        title: promptData.title,
        description: promptData.description,
        prompt: promptData.prompt,
        model: promptData.model,
        lang: promptData.lang,
        category: promptData.category,
        categoryId: promptData.categoryId, // Поддержка нового поля
        tags: promptData.tags,
        license: promptData.license,
        author: {
          connect: { id: user.id }
        }
      })
      createdPrompts.push(prompt)
    }
    
    console.log(`[Bulk Create] Created ${createdPrompts.length} prompts, category counters updated automatically`)

    return NextResponse.json({ 
      success: true, 
      count: createdPrompts.length,
      prompts: createdPrompts 
    })

  } catch (error) {
    console.error('Bulk create prompts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
