'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Edit, 
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { useAdminSearch } from '@/hooks/useAdminSearch'

interface Prompt {
  id: string
  title: string
  description: string
  prompt: string
  model: string
  lang: string
  category: string
  tags: string
  license: string
  author: {
    id: string
    name: string | null
    email: string | null
    createdAt: string
  }
  createdAt: string
  updatedAt: string
  averageRating: number
  totalRatings: number
  views: number
  stats: {
    ratings: number
    reviews: number
    likes: number
    saves: number
    comments: number
  }
}

interface PromptsData {
  prompts: Prompt[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    categories: Array<{
      category: string
      count: number
    }>
  }
}

export function AdminPromptManagement() {
  const [data, setData] = useState<PromptsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null)
  
  // Фильтры и поиск
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  // Используем улучшенный хук поиска
  const {
    searchValue,
    setSearchValue,
    isSearching,
    handleKeyDown,
    handleBlur,
    clearSearch
  } = useAdminSearch({
    onSearch: (query, finished) => {
      if (finished) {
        setSearchQuery(query)
        setCurrentPage(1) // Сбрасываем на первую страницу при новом поиске
      }
    },
    onSuggestions: (query) => {
      // Здесь можно добавить логику для подсказок
      if (query.trim()) {
        // Простые подсказки на основе текущих данных
        const suggestions = data?.prompts
          ?.map(p => p.title)
          .filter(title => title.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5) || []
        setSearchSuggestions(suggestions)
      } else {
        setSearchSuggestions([])
      }
    }
  })

  useEffect(() => {
    fetchPrompts()
  }, [searchQuery, selectedCategory, sortBy, sortOrder, currentPage])

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchQuery,
        category: selectedCategory,
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/admin/prompts?${params}`, {
        headers: {
          'Authorization': 'Bearer test-admin-key'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompts')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrompt = async (prompt: Prompt) => {
    try {
      const response = await fetch(`/api/admin/prompts?id=${prompt.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer test-admin-key'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete prompt')
      }

      // Обновляем список
      await fetchPrompts()
      setShowDeleteModal(false)
      setPromptToDelete(null)
      
      // Показываем уведомление об успехе
      alert('Промпт успешно удален')
    } catch (err) {
      alert(`Ошибка при удалении: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPrompts.size === 0) return
    
    if (!confirm(`Вы уверены, что хотите удалить ${selectedPrompts.size} промптов?`)) {
      return
    }

    try {
      const promises = Array.from(selectedPrompts).map(id => 
        fetch(`/api/admin/prompts?id=${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-admin-key'
          }
        })
      )
      
      await Promise.all(promises)
      setSelectedPrompts(new Set())
      await fetchPrompts()
      alert('Промпты успешно удалены')
    } catch (err) {
      alert('Ошибка при массовом удалении')
    }
  }

  const togglePromptSelection = (promptId: string) => {
    const newSelected = new Set(selectedPrompts)
    if (newSelected.has(promptId)) {
      newSelected.delete(promptId)
    } else {
      newSelected.add(promptId)
    }
    setSelectedPrompts(newSelected)
  }

  const toggleSelectAll = () => {
    if (!data) return
    
    if (selectedPrompts.size === data.prompts.length) {
      setSelectedPrompts(new Set())
    } else {
      setSelectedPrompts(new Set(data.prompts.map(p => p.id)))
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Управление промптами</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление промптами</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>Ошибка загрузки:</strong> {error}
          </div>
          <button
            onClick={fetchPrompts}
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
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Управление промптами</h1>
        <div className="flex items-center space-x-4">
          {selectedPrompts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить выбранные ({selectedPrompts.size})
            </button>
          )}
          <button
            onClick={fetchPrompts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по названию, описанию, автору..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            
            {/* Подсказки */}
            {searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchValue(suggestion)
                      setSearchQuery(suggestion)
                      setCurrentPage(1)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все категории</option>
              {data.filters.categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt_desc">Новые первые</option>
              <option value="createdAt_asc">Старые первые</option>
              <option value="views_desc">Больше просмотров</option>
              <option value="views_asc">Меньше просмотров</option>
              <option value="rating_desc">Выше рейтинг</option>
              <option value="rating_asc">Ниже рейтинг</option>
            </select>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Показано {data.prompts.length} из {data.pagination.total} промптов
            {selectedPrompts.size > 0 && ` • Выбрано: ${selectedPrompts.size}`}
          </div>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={data.prompts.length > 0 && selectedPrompts.size === data.prompts.length}
                onChange={toggleSelectAll}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">Выбрать все на странице</span>
            </label>
          </div>
        </div>
      </div>

      {/* Список промптов */}
      <div className="space-y-4">
        {data.prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedPrompts.has(prompt.id)}
                  onChange={() => togglePromptSelection(prompt.id)}
                  className="form-checkbox h-4 w-4 text-blue-600 mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {prompt.title}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {prompt.description}
                      </p>
                      
                      {/* Метаинформация */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="inline-flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {prompt.views} просмотров
                        </span>
                        <span>★ {prompt.averageRating.toFixed(1)} ({prompt.totalRatings})</span>
                        <span>{prompt.category}</span>
                        <span>{prompt.model}</span>
                        <span>{prompt.lang}</span>
                        <span>
                          {formatDistanceToNow(new Date(prompt.createdAt), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </span>
                      </div>
                      
                      {/* Теги */}
                      {prompt.tags && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {prompt.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Автор */}
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">Автор:</span>
                        <span className="font-medium text-gray-900">
                          {prompt.author.name || prompt.author.email}
                        </span>
                        <span className="text-gray-500">
                          (регистрация: {formatDistanceToNow(new Date(prompt.author.createdAt), { 
                            addSuffix: true, 
                            locale: ru 
                          })})
                        </span>
                      </div>
                      
                      {/* Статистика активности */}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{prompt.stats.likes} лайков</span>
                        <span>{prompt.stats.saves} сохранений</span>
                        <span>{prompt.stats.comments} комментариев</span>
                        <span>{prompt.stats.reviews} отзывов</span>
                      </div>
                    </div>
                    
                    {/* Действия */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/prompts/${prompt.id}`}
                        target="_blank"
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Открыть
                      </Link>
                      
                      <button
                        onClick={() => {
                          setPromptToDelete(prompt)
                          setShowDeleteModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </button>
                    </div>
                  </div>
                  
                  {/* Превью промпта */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      Показать текст промпта
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded border text-sm font-mono whitespace-pre-wrap">
                      {prompt.prompt.length > 500 
                        ? prompt.prompt.substring(0, 500) + '...' 
                        : prompt.prompt
                      }
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-700">
            Страница {data.pagination.page} из {data.pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!data.pagination.hasPrev}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!data.pagination.hasNext}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && promptToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Подтвердите удаление
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Вы уверены, что хотите удалить промпт "{promptToDelete.title}"?
              Это действие нельзя отменить.
            </p>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDeletePrompt(promptToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setPromptToDelete(null)
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
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
