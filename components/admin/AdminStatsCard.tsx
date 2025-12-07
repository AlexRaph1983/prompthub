'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminStatsCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'emerald'
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    change: 'text-blue-600'
  },
  green: {
    icon: 'text-green-600',
    bg: 'bg-green-50',
    change: 'text-green-600'
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-50',
    change: 'text-purple-600'
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-orange-50',
    change: 'text-orange-600'
  },
  emerald: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    change: 'text-emerald-600'
  }
}

export function AdminStatsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  color 
}: AdminStatsCardProps) {
  const colors = colorClasses[color] ?? colorClasses.blue
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={cn('p-3 rounded-lg', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change > 0 && (
            <p className={cn('text-sm', colors.change)}>
              +{change} {changeLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
