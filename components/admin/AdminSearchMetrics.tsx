'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'

interface SearchMetricsData {
  metrics: {
    countSaved: number
    countRejected: number
    totalQueries: number
    acceptanceRate: number
    rejectionRate: number
    lastUpdated: string
  }
  rejectionReasons: Record<string, number>
  rejectionStats?: Array<{
    reason: string
    count: number
    percentage: number
    description: string
  }>
}

export function AdminSearchMetrics() {
  const [data, setData] = useState<SearchMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetailedStats, setShowDetailedStats] = useState(false)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/search-metrics?includeStats=${showDetailedStats}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch search metrics')
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleDetailedStats = () => {
    setShowDetailedStats(!showDetailedStats)
    fetchMetrics()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Метрики поиска</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Метрики поиска</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>Ошибка загрузки:</strong> {error}
          </div>
          <button
            onClick={fetchMetrics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Заголовок и настройки */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Метрики поиска</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDetailedStats}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showDetailedStats 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showDetailedStats ? 'Скрыть детали' : 'Показать детали'}
          </button>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Сохранено запросов</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.metrics.countSaved.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                {data.metrics.acceptanceRate}% принято
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Отклонено запросов</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.metrics.countRejected.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                {data.metrics.rejectionRate}% отклонено
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего запросов</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.metrics.totalQueries.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Общая статистика
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Детальная статистика отклонений */}
      {showDetailedStats && data.rejectionStats && data.rejectionStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Причины отклонения запросов</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.rejectionStats.map((stat, index) => (
                <div key={stat.reason} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {stat.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {stat.count} отклонений
                    </p>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {stat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Информация о последнем обновлении */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center text-sm text-gray-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Последнее обновление: {new Date(data.metrics.lastUpdated).toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  )
}
