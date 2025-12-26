import { unstable_setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ProfileClient from './ProfileClient'
import { prisma } from '@/lib/prisma'

interface ProfileData {
  name: string | null
  email: string | null
  image?: string | null
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
    console.log('[Profile] Loading profile for userId:', userId)
    
    // Сначала проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
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

    // Если пользователь не найден в БД, создаём его
    if (!user) {
      console.log('[Profile] User not found in DB, will be created on first prompt/action')
      // Возвращаем заглушку с базовыми данными
      return {
        name: null,
        email: null,
        image: null,
        bio: null,
        website: null,
        telegram: null,
        github: null,
        twitter: null,
        linkedin: null,
        reputationScore: 0,
        reputationPromptCount: 0,
        reputationRatingsCnt: 0,
        reputationLikesCnt: 0,
        reputationSavesCnt: 0,
        reputationCommentsCnt: 0,
      }
    }

    console.log('[Profile] User found:', user.id, user.name)
    return user
  } catch (error) {
    console.error('[Profile] Failed to load profile:', error)
    return null
  }
}

export default async function ProfilePage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)

  const session = await auth()
  
  console.log('[Profile] Session:', session ? { userId: session.user?.id, name: session.user?.name } : 'null')

  if (!session?.user?.id) {
    console.log('[Profile] No session or user id, redirecting to signin')
    redirect(`/${locale}/auth/signin`)
  }

  const profile = await getProfile(session.user.id)

  if (!profile) {
    console.error('[Profile] Failed to get profile for user:', session.user.id)
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600 mt-2">Ошибка загрузки профиля. Попробуйте перезайти.</p>
          <a href={`/${locale}/auth/signin`} className="text-violet-600 underline mt-4 inline-block">
            Войти снова
          </a>
        </div>
      </div>
    )
  }

  // Добавляем данные из сессии, если они отсутствуют в профиле
  const enrichedProfile = {
    ...profile,
    name: profile.name || session.user.name || null,
    email: profile.email || session.user.email || null,
    image: profile.image || (session.user as any).image || null,
  }

  return (
    <ProfileClient
      profile={enrichedProfile}
      locale={locale}
    />
  )
}
