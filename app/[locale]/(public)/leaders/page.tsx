'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

export default function LeadersPage() {
  const [users, setUsers] = React.useState<Array<{ id: string; name: string | null; image: string | null; reputationScore: number }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('leaders')

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    
    fetch('/api/users/leaderboard')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data')
        }
        return response.json()
      })
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching leaderboard:', err)
        setError(err.message)
        setUsers([])
        setLoading(false)
      })
  }, [])

  const handleUserClick = (userId: string) => {
    router.push(`/${locale}/prompts?authorId=${encodeURIComponent(userId)}`)
  }

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen pb-12">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-semibold mb-6">{t('title')}</h1>
          <Card className="p-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <span className="ml-3 text-gray-600">{t('loading')}</span>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="bg-gray-50 min-h-screen pb-12">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-semibold mb-6">{t('title')}</h1>
          <Card className="p-4">
            <div className="text-center text-red-600 py-8">
              <p>{t('error')}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
              >
                {t('retry')}
              </button>
            </div>
          </Card>
        </div>
      </main>
    )
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


