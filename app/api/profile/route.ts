import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bio, website, telegram, github, twitter, linkedin } = body

    // Валидация данных
    const updateData: any = {}
    
    if (bio !== undefined) {
      updateData.bio = bio || null
    }
    if (website !== undefined) {
      updateData.website = website || null
    }
    if (telegram !== undefined) {
      updateData.telegram = telegram || null
    }
    if (github !== undefined) {
      updateData.github = github || null
    }
    if (twitter !== undefined) {
      updateData.twitter = twitter || null
    }
    if (linkedin !== undefined) {
      updateData.linkedin = linkedin || null
    }

    // Обновляем профиль
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        telegram: true,
        github: true,
        twitter: true,
        linkedin: true,
        reputationScore: true,
        reputationPromptCount: true,
        reputationRatingsCnt: true,
        reputationLikesCnt: true,
        reputationSavesCnt: true,
        reputationCommentsCnt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        telegram: true,
        github: true,
        twitter: true,
        linkedin: true,
        reputationScore: true,
        reputationPromptCount: true,
        reputationRatingsCnt: true,
        reputationLikesCnt: true,
        reputationSavesCnt: true,
        reputationCommentsCnt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
