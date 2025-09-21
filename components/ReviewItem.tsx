'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { RatingStars } from '@/components/RatingStars'

interface ReviewItemProps {
  reviewerName: string | null
  reviewerImage?: string | null
  rating: number
  comment?: string | null
  createdAt: string | Date
}

export function ReviewItem({ reviewerName, reviewerImage, rating, comment, createdAt }: ReviewItemProps) {
  const initials = (reviewerName || 'U')
    .split(' ')
    .map((s) => s.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const dateStr = new Date(createdAt).toISOString().slice(0, 10)

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="w-9 h-9">
        {reviewerImage ? (
          <AvatarImage src={reviewerImage} alt={reviewerName || 'User'} />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{reviewerName || 'Пользователь'}</span>
          <span className="text-xs text-gray-500"><time suppressHydrationWarning>{dateStr}</time></span>
        </div>
        <div className="mt-1">
          <RatingStars value={rating} size="sm" readOnly />
        </div>
        {comment ? (
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment}</p>
        ) : null}
      </div>
    </div>
  )
}


