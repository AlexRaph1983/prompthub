'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileEditForm } from '@/components/ProfileEditForm'

interface ProfileData {
  name: string
  email: string
  bio?: string
  website?: string
  telegram?: string
  github?: string
  twitter?: string
  linkedin?: string
  reputationScore: number
  reputationPromptCount: number
  reputationLikesCnt: number
  reputationSavesCnt: number
  reputationRatingsCnt: number
  reputationCommentsCnt: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/api/auth/signin')
      return
    }

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else {
          console.error('Failed to load profile')
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [session, status, router])

  const handleSaveProfile = async (data: ProfileData) => {
    setProfile(data)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Управление вашим профилем</p>
      </div>

      <ProfileEditForm 
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* Статистика */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.reputationPromptCount}</div>
              <div className="text-sm text-gray-600">Опубликованных промптов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{profile.reputationLikesCnt}</div>
              <div className="text-sm text-gray-600">Лайки</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.reputationSavesCnt}</div>
              <div className="text-sm text-gray-600">Сохранения</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{profile.reputationRatingsCnt}</div>
              <div className="text-sm text-gray-600">Всего оценок</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{profile.reputationCommentsCnt}</div>
              <div className="text-sm text-gray-600">Комментарии</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
