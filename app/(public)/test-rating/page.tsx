'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/RatingStars'

export default function TestRatingPage() {
  const [ratingData, setRatingData] = React.useState<{ average: number; count: number; myRating: number | null; canRate?: boolean } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState(true) // В dev режиме всегда авторизован
  const [userId, setUserId] = React.useState('test-user-2')

  const testPromptId = 'test-prompt-1'

  React.useEffect(() => {
    // Загружаем данные рейтинга
    fetch(`/api/ratings?promptId=${testPromptId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        console.log('Rating data loaded:', data)
        setRatingData(data)
      })
      .catch(err => {
        console.error('Failed to load rating data:', err)
        setRatingData({ average: 0, count: 0, myRating: null, canRate: true })
      })
  }, [])

  const handleRate = async (value: number) => {
    console.log('handleRate called with value:', value)
    
    try {
      console.log('Submitting rating:', value)
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ promptId: testPromptId, value }),
      })
      
      console.log('Rating response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Rating submitted successfully:', data)
        setRatingData(data)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Rating submission failed:', errorData)
      }
    } catch (err) {
      console.error('Rating submission error:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест рейтингов</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Статус авторизации</h2>
          <p>Авторизован: {isLoggedIn ? 'Да' : 'Нет'}</p>
          {userId && <p>User ID: {userId}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Рейтинг промпта</h2>
          <p>Prompt ID: {testPromptId}</p>
          <div className="mt-4">
            <RatingStars
              value={ratingData?.average ?? 0}
              count={ratingData?.count}
              myRating={ratingData?.myRating ?? undefined}
              onRate={handleRate}
              readOnly={false}
              disabled={ratingData?.canRate === false}
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Можно оценивать: {ratingData?.canRate ? 'Да' : 'Нет'}</p>
            <p>Моя оценка: {ratingData?.myRating ?? 'Нет'}</p>
            <p>Средняя оценка: {ratingData?.average ?? 0}</p>
            <p>Количество оценок: {ratingData?.count ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Отладочная информация</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(ratingData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
