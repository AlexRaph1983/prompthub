'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Рейтинг авторов — PromptHub',
  description: 'Топ авторов по репутации и качеству промптов. Лучшие создатели контента в области искусственного интеллекта.',
  keywords: 'рейтинг, авторы, репутация, лидеры, промпты, ИИ',
  openGraph: {
    title: 'Рейтинг авторов — PromptHub',
    description: 'Топ авторов по репутации и качеству промптов. Лучшие создатели контента в области искусственного интеллекта.',
    type: 'website',
    siteName: 'PromptHub'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Рейтинг авторов — PromptHub',
    description: 'Топ авторов по репутации и качеству промптов. Лучшие создатели контента в области искусственного интеллекта.'
  }
}
export default function LeadersPage() {
  const [users, setUsers] = React.useState<Array<{ id: string; name: string | null; image: string | null; reputationScore: number }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

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
    router.push(`/prompts?authorId=${encodeURIComponent(userId)}`)
  }

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen pb-12">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-semibold mb-6">Рейтинг авторов</h1>
          <Card className="p-4">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <span className="ml-3 text-gray-600">Загрузка рейтинга...</span>
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
          <h1 className="text-3xl font-semibold mb-6">Рейтинг авторов</h1>
          <Card className="p-4">
            <div className="text-center text-red-600 py-8">
              <p>Ошибка загрузки данных</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
              >
                Попробовать снова
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
        <h1 className="text-3xl font-semibold mb-6">Рейтинг авторов</h1>
        <p className="text-gray-600 mb-6">Топ авторов по репутации и качеству промптов</p>
        
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
                  {user.name || 'Анонимный пользователь'}
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
                Нет данных для отображения
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}


