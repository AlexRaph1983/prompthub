'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function getTierColors(tier: 'bronze' | 'silver' | 'gold' | 'platinum') {
  switch (tier) {
    case 'platinum': return 'bg-slate-100 text-slate-800 border-slate-300'
    case 'gold': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'silver': return 'bg-zinc-100 text-zinc-800 border-zinc-300'
    default: return 'bg-orange-100 text-orange-800 border-orange-300'
  }
}

interface Props {
  score: number
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  className?: string
  compact?: boolean
}

export function UserReputationBadge({ score, tier = 'bronze', className, compact }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
        getTierColors(tier),
        className,
      )}
      title={`Репутация: ${score}`}
    >
      <span className={cn('font-semibold', compact && 'hidden sm:inline')}>{score}</span>
      <span className="uppercase tracking-wide">{tier}</span>
    </span>
  )
}


