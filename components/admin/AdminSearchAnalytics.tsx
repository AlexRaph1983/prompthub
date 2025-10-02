'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BarChart3,
  Download,
  Calendar,
  AlertCircle,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react'
import { exportSearchQueries, exportDetailedSearchQueries } from '@/lib/csv-export'

interface SearchAnalyticsData {
  summary: {
    totalSearches: number
    uniqueUsers: number
    averageResults: number
    period: string
    startDate: string
    endDate: string
  }
  topQueries: Array<{
    query: string
    count: number
    averageResults: number
  }>
  dailyStats: Array<{
    date: string
    totalSearches: number
    uniqueUsers: number
    averageResults: number
  }>
  zeroResultQueries: Array<{
    query: string
    count: number
  }>
  recentQueries: Array<{
    id: string
    query: string
    userId: string | null
    resultsCount: number
    hasClick: boolean
    createdAt: string
    userAgent: string | null
  }>
}

export function AdminSearchAnalytics() {
  const [data, setData] = useState<SearchAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [selectedQueries, setSelectedQueries] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/search-analytics?days=${selectedPeriod}&limit=100`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch search analytics')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!data) return
    
    try {
      // Экспортируем топ запросы
      exportSearchQueries(data.topQueries, selectedPeriod)
    } catch (err) {
      console.error('Export error:', err)
      alert('Ошибка при экспорте данных')
    }
  }

  const exportDetailedData = async () => {
    if (!data) return
    
    try {
      // Экспортируем детальные данные
      exportDetailedSearchQueries(data.recentQueries, selectedPeriod)
    } catch (err) {
      console.error('Detailed export error:', err)
      alert('Ошибка при экспорте детальных данных')
    }
  }

  const handleSelectQuery = (queryId: string) => {
    const newSelected = new Set(selectedQueries)
    if (newSelected.has(queryId)) {
      newSelected.delete(queryId)
    } else {
      newSelected.add(queryId)
    }
    setSelectedQueries(newSelected)
  }

  const handleSelectAll = () => {
    if (!data) return
    
    if (selectedQueries.size === data.recentQueries.length) {
      setSelectedQueries(new Set())
    } else {
      setSelectedQueries(new Set(data.recentQueries.map(q => q.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedQueries.size === 0) return
    
    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/search-analytics/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryIds: Array.from(selectedQueries)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete queries')
      }

      const result = await response.json()
      alert(`Успешно удалено ${result.deletedCount} записей`)
      
      // Обновляем данные
      await fetchAnalytics()
      setSelectedQueries(new Set())
      setShowDeleteModal(false)
    } catch (err) {
      alert('Ошибка при удалении записей')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Аналитика поиска</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Аналитика поиска</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>Ошибка загрузки:</strong> {error}
          </div>
          <button
            onClick={fetchAnalytics}
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
        <h1 className="text-2xl font-bold text-gray-900">Аналитика поиска</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={7}>Последние 7 дней</option>
            <option value={30}>Последние 30 дней</option>
            <option value={90}>Последние 90 дней</option>
          </select>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Экспорт топ
            </button>
            <button
              onClick={exportDetailedData}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Детальный экспорт
            </button>
          </div>
          {selectedQueries.size > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить ({selectedQueries.size})
            </button>
          )}
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего поисков</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.totalSearches.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{data.summary.period}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Уникальные пользователи</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.uniqueUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-50">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Среднее результатов</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.summary.averageResults}
              </p>
              <p className="text-sm text-gray-500">на запрос</p>
            </div>
          </div>
        </div>
      </div>

      {/* График по дням */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Активность по дням</h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-1">
            {data.dailyStats.slice(-14).map((day, index) => {
              const maxSearches = Math.max(...data.dailyStats.map(d => d.totalSearches))
              const height = maxSearches > 0 ? (day.totalSearches / maxSearches) * 100 : 0
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.totalSearches} поисков, ${day.uniqueUsers} пользователей`}
                  />
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Топ запросы и проблемные запросы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ поисковые запросы */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Популярные запросы</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.topQueries.slice(0, 10).map((query, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      "{query.query}"
                    </p>
                    <p className="text-sm text-gray-500">
                      {query.count} поисков • {query.averageResults.toFixed(1)} результатов
                    </p>
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Запросы без результатов */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Запросы без результатов</h3>
            </div>
          </div>
          <div className="p-6">
            {data.zeroResultQueries.length > 0 ? (
              <div className="space-y-4">
                {data.zeroResultQueries.slice(0, 10).map((query, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        "{query.query}"
                      </p>
                      <p className="text-sm text-gray-500">
                        {query.count} неудачных поисков
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        0 результатов
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Все запросы возвращают результаты!</p>
            )}
          </div>
        </div>
      </div>

      {/* Последние поисковые запросы */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Последние поисковые запросы</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 hover:text-gray-700"
                  >
                    {selectedQueries.size === data.recentQueries.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>Выбрать все</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Запрос
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Результаты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Время
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentQueries.slice(0, 20).map((query) => (
                <tr key={query.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSelectQuery(query.id)}
                      className="flex items-center space-x-2 hover:text-gray-700"
                    >
                      {selectedQueries.has(query.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      "{query.query}"
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {query.userId ? 'Авторизован' : 'Гость'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      query.resultsCount > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {query.resultsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {query.hasClick ? (
                      <span className="text-green-600 text-sm">✓ Да</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Нет</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(query.createdAt).toLocaleString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Подтверждение удаления
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Вы уверены, что хотите удалить {selectedQueries.size} поисковых записей? 
              Это действие нельзя отменить.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
