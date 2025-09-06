'use client'

import React from 'react'
import { RatingStars } from '@/components/RatingStars'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface ReviewFormProps {
  promptId: string
  isOwner: boolean
  existingRating?: number | null
  existingComment?: string | null
  onSubmitted?: (payload: { rating: number; comment: string | null; average: number; count: number }) => void
  locked?: boolean
}

export function ReviewForm({ promptId, isOwner, existingRating, existingComment, onSubmitted, locked }: ReviewFormProps) {
  const { isAuthenticated, signIn } = useAuth()
  const [rating, setRating] = React.useState<number | null>(existingRating ?? null)
  const [comment, setComment] = React.useState<string>(existingComment ?? '')
  const [submitting, setSubmitting] = React.useState(false)

  const hasExisting = typeof existingRating === 'number' || (existingComment != null && existingComment !== '')
  const disabled = !isAuthenticated || isOwner || submitting || locked || hasExisting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) {
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ promptId, rating, comment }),
      })
      if (res.status === 401) {
        signIn()
        return
      }
      if (!res.ok) {
        // could add toast here
        return
      }
      const data = await res.json()
      onSubmitted?.({ rating, comment: comment.trim() ? comment.trim() : null, average: data.average, count: data.count })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Ваша оценка</span>
        <RatingStars
          value={rating ?? 0}
          myRating={rating ?? undefined}
          onRate={(v) => setRating(v)}
          disabled={disabled}
          showSummary={false}
        />
      </div>
      <Textarea
        rows={4}
        maxLength={2000}
        placeholder="Поделитесь опытом (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={disabled}
      />
      <div className="flex justify-end">
        {!isAuthenticated ? (
          <Button type="button" onClick={() => signIn()} className="bg-violet-600 text-white">Войти, чтобы оставить отзыв</Button>
        ) : isOwner ? (
          <Button type="button" disabled>Нельзя отзыв на свой промпт</Button>
        ) : hasExisting || locked ? (
          <Button type="button" disabled>Отзыв уже оставлен</Button>
        ) : (
          <Button type="submit" disabled={!rating || submitting} className="bg-violet-600 text-white">
            Оставить отзыв
          </Button>
        )}
      </div>
    </form>
  )
}


