'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { UserReputationBadge } from '@/components/UserReputationBadge'

export default function TestReputationPage() {
  const [reputationData, setReputationData] = React.useState<any>(null)
  const [leaderboardData, setLeaderboardData] = React.useState<any[]>([])

  React.useEffect(() => {
    // Загружаем данные репутации
    fetch('/api/users/leaderboard')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        console.log('Leaderboard data loaded:', data)
        setLeaderboardData(data)
      })
      .catch(err => {
        console.error('Failed to load leaderboard data:', err)
      })
  }, [])

  const handleTestReputation = async () => {
    try {
      console.log('Testing reputation calculation...')
      const res = await fetch('/api/users/test-user-1/reputation')
      
      if (res.ok) {
        const data = await res.json()
        console.log('Reputation test result:', data)
        setReputationData(data)
      } else {
        console.error('Reputation test failed:', res.status)
      }
    } catch (err) {
      console.error('Reputation test error:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест системы репутации</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Расчёт репутации</h2>
          <Button onClick={handleTestReputation} className="mb-4">
            Рассчитать репутацию test-user-1
          </Button>
          
          {reputationData && (
            <div className="space-y-2">
              <p><strong>Средний рейтинг:</strong> {reputationData.avgPromptRating}</p>
              <p><strong>Количество оценок:</strong> {reputationData.ratingsCount}</p>
              <p><strong>Количество промптов:</strong> {reputationData.promptCount}</p>
              <p><strong>Лайки:</strong> {reputationData.likesCount}</p>
              <p><strong>Сохранения:</strong> {reputationData.savesCount}</p>
              <p><strong>Комментарии:</strong> {reputationData.commentsCount}</p>
              <p><strong>Репутация:</strong> {reputationData.score0to100}/100</p>
              <p><strong>Тир:</strong> {reputationData.tier}</p>
              <UserReputationBadge score={reputationData.score0to100} tier={reputationData.tier} />
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Лидерборд</h2>
          <div className="space-y-2">
            {leaderboardData.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span className="font-bold">#{index + 1}</span>
                  <span>{user.name || 'Anonymous'}</span>
                  <UserReputationBadge score={user.reputationScore} />
                </div>
                <span className="text-sm text-gray-500">{user.reputationScore} очков</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Отладочная информация</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({ reputationData, leaderboardData }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
