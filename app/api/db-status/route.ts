import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ROUTES !== '1') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    console.log('Checking database status...')

    // Проверяем подключение к базе данных
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Получаем количество записей в каждой таблице
    const userCount = await prisma.user.count()
    const promptCount = await prisma.prompt.count()
    const ratingCount = await prisma.rating.count()
    const likeCount = await prisma.like.count()
    const saveCount = await prisma.save.count()
    const commentCount = await prisma.comment.count()

    console.log('📊 Database statistics:')
    console.log(`- Users: ${userCount}`)
    console.log(`- Prompts: ${promptCount}`)
    console.log(`- Ratings: ${ratingCount}`)
    console.log(`- Likes: ${likeCount}`)
    console.log(`- Saves: ${saveCount}`)
    console.log(`- Comments: ${commentCount}`)

    // Получаем несколько примеров данных
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    const samplePrompts = await prisma.prompt.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        authorId: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Database status check completed',
      statistics: {
        users: userCount,
        prompts: promptCount,
        ratings: ratingCount,
        likes: likeCount,
        saves: saveCount,
        comments: commentCount,
      },
      sampleData: {
        users: sampleUsers,
        prompts: samplePrompts,
      }
    })
  } catch (error) {
    console.error('❌ Database status check failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
