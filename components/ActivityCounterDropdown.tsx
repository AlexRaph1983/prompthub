'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, Eye, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface StatsData {
  users: number
  prompts: number
  views: number
  ratings: number
  reviews: number
  timestamp: string
  cached?: boolean
  cacheAge?: number
}

export function ActivityCounterDropdown() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? '/api/stats?refresh=true' : '/api/stats'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Обновляем статистику каждые 30 секунд
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const statsItems = [
    {
      icon: Users,
      value: stats?.users || 0,
      label: 'Пользователи',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: FileText,
      value: stats?.prompts || 0,
      label: 'Промпты',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200'
    },
    {
      icon: Eye,
      value: stats?.views || 0,
      label: 'Просмотры',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: Star,
      value: (stats?.ratings || 0) + (stats?.reviews || 0),
      label: 'Оценки',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-orange-600" />
          <span className="hidden sm:inline">Активность</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-4 bg-white border-orange-200 shadow-lg"
      >
        <div className="space-y-4">
          {/* Заголовок */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Активность</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {stats?.cached ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Кэш {stats.cacheAge}s</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Счетчики в сетке 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {statsItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg border
                    ${item.bgColor} ${item.borderColor}
                    transition-all duration-300 hover:shadow-md hover:scale-105
                    group
                  `}
                >
                  <Icon className={`w-5 h-5 ${item.color} transition-transform group-hover:scale-110`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-lg font-bold ${item.color} transition-colors`}>
                      {isLoading ? (
                        <div className="w-8 h-5 bg-gray-200 rounded animate-pulse"></div>
                      ) : error ? (
                        <span className="text-red-500">--</span>
                      ) : (
                        formatNumber(item.value)
                      )}
                    </span>
                    <span className="text-xs text-gray-600 truncate">
                      {item.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Информация о последнем обновлении */}
          {stats && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              <div>Обновлено: {new Date(stats.timestamp).toLocaleTimeString('ru-RU')}</div>
              <button 
                onClick={() => fetchStats(true)}
                className="mt-1 text-orange-600 hover:text-orange-700 underline"
                disabled={isLoading}
              >
                {isLoading ? 'Обновление...' : 'Обновить'}
              </button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
