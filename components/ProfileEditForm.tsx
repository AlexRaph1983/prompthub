'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { ExternalLink, Save, Edit } from 'lucide-react'

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

interface Props {
  profile: ProfileData
  onSave?: (data: ProfileData) => void
}

export function ProfileEditForm({ profile, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [formData, setFormData] = useState({
    bio: profile.bio ?? '',
    website: profile.website ?? '',
    telegram: profile.telegram ?? '',
    github: profile.github ?? '',
    twitter: profile.twitter ?? '',
    linkedin: profile.linkedin ?? '',
  })

  const tier = currentProfile.reputationScore >= 85 ? 'platinum' : 
               currentProfile.reputationScore >= 65 ? 'gold' : 
               currentProfile.reputationScore >= 40 ? 'silver' : 'bronze'

  const canShowLinks = currentProfile.reputationScore >= 65 // gold и выше

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedProfile = await response.json()
      setCurrentProfile(updatedProfile)
      if (onSave) {
        onSave(updatedProfile)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      bio: currentProfile.bio ?? '',
      website: currentProfile.website ?? '',
      telegram: currentProfile.telegram ?? '',
      github: currentProfile.github ?? '',
      twitter: currentProfile.twitter ?? '',
      linkedin: currentProfile.linkedin ?? '',
    })
    setIsEditing(false)
  }

  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Информация о пользователе</CardTitle>
            <UserReputationBadge score={currentProfile.reputationScore} tier={tier} />
          </div>
        </CardHeader>
        <CardContent>
                      <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Имя</label>
                <p className="text-lg font-semibold">{currentProfile.name ?? 'Не указано'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{currentProfile.email ?? 'Не указано'}</p>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Описание профиля */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Описание профиля</CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">О себе</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Расскажите о себе, своих интересах и опыте..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {currentProfile.bio ? (
                <p className="text-gray-700 whitespace-pre-wrap">{currentProfile.bio}</p>
              ) : (
                <p className="text-gray-500 italic">Описание не добавлено</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Внешние ссылки */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Внешние ссылки</CardTitle>
            {!canShowLinks && (
              <Badge variant="secondary" className="text-xs">
                Доступно с золотого уровня
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Сайт</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telegram</label>
                  <Input
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">GitHub</label>
                  <Input
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Twitter/X</label>
                  <Input
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                  <Input
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {canShowLinks ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentProfile.website && (
                    <a
                      href={formatUrl(currentProfile.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Сайт
                    </a>
                  )}
                  {currentProfile.telegram && (
                    <a
                      href={`https://t.me/${currentProfile.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Telegram
                    </a>
                  )}
                  {currentProfile.github && (
                    <a
                      href={`https://github.com/${currentProfile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {currentProfile.twitter && (
                    <a
                      href={`https://twitter.com/${currentProfile.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Twitter/X
                    </a>
                  )}
                  {currentProfile.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${currentProfile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Внешние ссылки будут видны другим пользователям при достижении золотого уровня репутации
                </p>
              )}
              {(!currentProfile.website && !currentProfile.telegram && !currentProfile.github && !currentProfile.twitter && !currentProfile.linkedin) && canShowLinks && (
                <p className="text-gray-500 italic">Ссылки не добавлены</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
