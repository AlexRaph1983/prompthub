'use client'

import React from 'react'
import { ReviewItem } from '@/components/ReviewItem'
import { AnimatePresence, motion } from 'framer-motion'

interface ReviewApiItem {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  userId: string
  user?: { name: string | null; image: string | null } | null
}

interface ReviewListProps {
  promptId: string
}

export function ReviewList({ promptId }: ReviewListProps) {
  const [items, setItems] = React.useState<ReviewApiItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews?promptId=${encodeURIComponent(promptId)}`, { cache: 'no-store' as any, credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.reviews || [])
    } finally {
      setLoading(false)
    }
  }, [promptId])

  React.useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="text-sm text-gray-500">Загрузка отзывов…</div>
  }

  if (!items.length) {
    return <div className="text-sm text-gray-500">Пока нет отзывов</div>
  }

  return (
    <div className="divide-y">
      <AnimatePresence initial={false}>
        {items.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <ReviewItem
              reviewerName={r.user?.name ?? null}
              reviewerImage={r.user?.image ?? null}
              rating={r.rating}
              comment={r.comment ?? null}
              createdAt={r.createdAt}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}


