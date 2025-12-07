'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  FileText, 
  Eye, 
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Copy
} from 'lucide-react'
import { AdminStatsCard } from './AdminStatsCard'
import { AdminChart } from './AdminChart'
import { AdminRecentActivity } from './AdminRecentActivity'

interface DashboardData {
  overview: {
    totalUsers: number
    totalPrompts: number
    totalViews: number
    totalSearches: number
    totalCopies: number
    today: {
      users: number
      prompts: number
      views: number
      searches: number
    }
    week: {
      users: number
      prompts: number
      views: number
      searches: number
    }
  }
  charts: {
    userGrowth: Array<{
      date: string
      newUsers: number
      cumulativeUsers: number
    }>
    categoryStats: Array<{
      category: string
      count: number
      averageViews: number
      averageRating: number
    }>
    dailyStats: Array<{
      date: string
      views: number
      copies: number
      cumulativeViews: number
      cumulativeCopies: number
    }>
    dailyStatsAllTime?: Array<{
      date: string
      views: number
      copies: number
      cumulativeViews: number
      cumulativeCopies: number
    }>
    monthlyBaseline?: {
      views: number
      copies: number
    }
  }
  topContent: {
    prompts: Array<{
      id: string
      title: string
      views: number
      rating: number
      ratingsCount: number
      author: string
      createdAt: string
    }>
    searchQueries: Array<{
      query: string
      count: number
      averageResults: number
    }>
  }
  recentActivity: {
    prompts: Array<{
      id: string
      title: string
      description: string
      views: number
      rating: number
      author: string
      createdAt: string
    }>
  }
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewsRange, setViewsRange] = useState<'month' | 'all'>('month')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching dashboard data...')
      const response = await fetch('/api/admin/dashboard')
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📊 API Response:', result)
      
      // Преобразуем данные в ожидаемый формат
      const transformedData: DashboardData = {
        overview: {
          totalUsers: result.data?.users?.total || 0,
          totalPrompts: result.data?.prompts?.total || 0,
          totalViews: result.data?.views || 0,
          totalSearches: result.data?.searches || 0,
          totalCopies: result.data?.copies || 0,
          today: {
            users: 0, // Пока не реализовано
            prompts: 0,
            views: 0,
            searches: 0
          },
          week: {
            users: 0, // Пока не реализовано
            prompts: 0,
            views: 0,
            searches: 0
          }
        },
        charts: {
          userGrowth: [], // Пока не реализовано
          categoryStats: [],
          dailyStats: result.data?.dailyStats || [],
          dailyStatsAllTime: result.data?.dailyStatsAllTime || [],
          monthlyBaseline: result.data?.monthlyBaseline || { views: 0, copies: 0 }
        },
        topContent: {
          prompts: result.data?.prompts?.recent?.map((p: any) => ({
            id: p.id,
            title: p.title,
            views: p.views || 0,
            rating: p.averageRating || 0,
            ratingsCount: p.totalRatings || 0,
            author: p.author?.name || 'Unknown',
            createdAt: p.createdAt
          })) || [],
          searchQueries: []
        },
        recentActivity: {
          prompts: result.data?.prompts?.recent?.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            views: p.views || 0,
            rating: p.averageRating || 0,
            author: p.author?.name || 'Unknown',
            createdAt: p.createdAt
          })) || []
        }
      }
      
      console.log('✅ Transformed data:', transformedData)
      setData(transformedData)
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>Ошибка загрузки данных:</strong> {error}
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = [
    {
      title: 'Всего пользователей',
      value: data.overview.totalUsers.toLocaleString(),
      change: data.overview.today.users,
      changeLabel: 'сегодня',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Всего промптов',
      value: data.overview.totalPrompts.toLocaleString(),
      change: data.overview.today.prompts,
      changeLabel: 'сегодня',
      icon: FileText,
      color: 'green'
    },
    {
      title: 'Всего просмотров',
      value: data.overview.totalViews.toLocaleString(),
      change: data.overview.today.views,
      changeLabel: 'сегодня',
      icon: Eye,
      color: 'purple'
    },
    {
      title: 'Всего копирований',
      value: data.overview.totalCopies.toLocaleString(),
      change: 0,
      changeLabel: 'сегодня',
      icon: Copy,
      color: 'emerald'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Обновлено: {new Date().toLocaleTimeString('ru-RU')}</span>
          <button
            onClick={fetchDashboardData}
            className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <AdminStatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Недельная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Пользователи за неделю</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.overview.week.users}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Промпты за неделю</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.overview.week.prompts}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Просмотры за неделю</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.overview.week.views}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Поиски за неделю</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.overview.week.searches}
              </p>
            </div>
            <Search className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 gap-6">
        {/* Главный график - Просмотры и Копирования */}
        <AdminChart
          title="📈 Рост просмотров и копирований"
          data={data.charts.dailyStats}
          allTimeData={data.charts.dailyStatsAllTime}
          monthlyBaseline={data.charts.monthlyBaseline}
          type="viewsCopies"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminChart
          title="Рост пользователей"
          data={data.charts.userGrowth}
          type="userGrowth"
        />
        <AdminChart
          title="Статистика по категориям"
          data={data.charts.categoryStats}
          type="categories"
        />
      </div>

      {/* Топ контент и последняя активность */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Топ промпты</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.topContent.prompts.slice(0, 5).map((prompt, index) => (
                <div key={prompt.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {prompt.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {prompt.author} • {prompt.views} просмотров
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-yellow-600">
                      ★ {prompt.rating}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({prompt.ratingsCount})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Топ поисковые запросы</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.topContent.searchQueries.slice(0, 5).map((query, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      "{query.query}"
                    </p>
                    <p className="text-sm text-gray-500">
                      {query.count} запросов • {query.averageResults} результатов в среднем
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Последняя активность */}
      <AdminRecentActivity data={data.recentActivity} />
    </div>
  )
}
