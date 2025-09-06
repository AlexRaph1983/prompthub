'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileEditForm } from '@/components/ProfileEditForm'

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

interface ProfileClientProps {
  profile: ProfileData
  locale: string
}

export default function ProfileClient({ profile, locale }: ProfileClientProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Управление вашим профилем</p>
      </div>

      <ProfileEditForm
        profile={profile}
        onSave={() => {
          // Можно добавить логику обновления профиля после сохранения
          window.location.reload()
        }}
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
