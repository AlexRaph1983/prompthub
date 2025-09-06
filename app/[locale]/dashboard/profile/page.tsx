import { unstable_setRequestLocale } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import ProfileClient from './ProfileClient'
import { prisma } from '@/lib/prisma'

interface ProfileData {
  name: string | null
  email: string | null
  bio?: string | null
  website?: string | null
  telegram?: string | null
  github?: string | null
  twitter?: string | null
  linkedin?: string | null
  reputationScore: number
  reputationPromptCount: number
  reputationLikesCnt: number
  reputationSavesCnt: number
  reputationRatingsCnt: number
  reputationCommentsCnt: number
}

async function getProfile(userId: string): Promise<ProfileData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    return user
  } catch (error) {
    console.error('Failed to load profile:', error)
    return null
  }
}

export default async function ProfilePage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${locale}/api/auth/signin`)
  }

  const profile = await getProfile(session.user.id)

  if (!profile) {
    // Можно вернуть страницу с ошибкой или перенаправить
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Ошибка загрузки профиля</p>
        </div>
      </div>
    )
  }

  return (
    <ProfileClient
      profile={profile}
      locale={locale}
    />
  )
}
