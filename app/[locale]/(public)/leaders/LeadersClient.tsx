'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { useTranslations } from 'next-intl'

interface User {
  id: string
  name: string | null
  image: string | null
  reputationScore: number
}

interface LeadersClientProps {
  users: User[]
  locale: string
}

export default function LeadersClient({ users, locale }: LeadersClientProps) {
  const router = useRouter()
  const t = useTranslations('leaders')

  const handleUserClick = (userId: string) => {
    router.push(`/${locale}/prompts?authorId=${encodeURIComponent(userId)}`)
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6">{t('title')}</h1>
        <p className="text-gray-600 mb-6">{t('subtitle')}</p>

        <Card className="p-4">
          <div className="divide-y">
            {users.map((user, idx) => (
              <div key={user.id} className="flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 text-center text-gray-500 font-medium">
                  {idx + 1}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.image || ''} />
                  <AvatarFallback className="bg-violet-100 text-violet-600">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="flex-1 text-left font-medium text-gray-900 hover:text-violet-600 transition-colors"
                  onClick={() => handleUserClick(user.id)}
                >
                  {user.name || t('anonymous')}
                </button>
                <UserReputationBadge
                  score={user.reputationScore}
                  tier={
                    user.reputationScore >= 85 ? 'platinum' :
                    user.reputationScore >= 65 ? 'gold' :
                    user.reputationScore >= 40 ? 'silver' : 'bronze'
                  }
                />
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {t('noData')}
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}
