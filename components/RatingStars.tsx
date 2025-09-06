'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number
  count?: number
  myRating?: number | null
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
  onRate?: (value: number) => void
  className?: string
  disabled?: boolean
  showSummary?: boolean
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function RatingStars({ value, count, myRating, size = 'md', readOnly, onRate, className, disabled, showSummary = true }: RatingStarsProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  
  // Приоритет: myRating > hovered > value
  // Если есть myRating - показываем его, иначе показываем hover или среднее
  const displayValue = typeof myRating === 'number' 
    ? myRating 
    : (hovered ?? value)

  const handleClick = (idx: number) => {
    if (readOnly || disabled || !onRate) return
    console.log('RatingStars: clicked star', idx)
    onRate(idx)
  }

  const handleMouseEnter = (idx: number) => {
    if (readOnly || disabled) return
    setHovered(idx)
  }

  const handleMouseLeave = () => {
    setHovered(null)
  }

  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <div className="flex items-center" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= displayValue
          return (
            <motion.button
              key={i}
              type="button"
              whileHover={{ scale: readOnly || disabled ? 1 : 1.1 }}
              whileTap={{ scale: readOnly || disabled ? 1 : 0.95 }}
              onMouseEnter={() => handleMouseEnter(i)}
              onClick={() => handleClick(i)}
              aria-label={`Rate ${i} stars`}
              className={cn('p-0.5', (readOnly || disabled) && 'cursor-default opacity-60')}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  'transition-colors',
                  filled ? 'text-amber-500 fill-amber-400 drop-shadow-sm' : 'text-gray-300'
                )}
              />
            </motion.button>
          )
        })}
      </div>
      {showSummary && (
        <div className="text-xs text-gray-500">
          {value ? value.toFixed(1) : '—'}{typeof count === 'number' && <span className="ml-1">({count})</span>}
        </div>
      )}
    </div>
  )
}


