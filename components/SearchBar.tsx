'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { useSearchTracking } from '@/hooks/useSearchTracking'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { SearchSuggestionsList } from './SearchSuggestionsList'
import { SearchChips } from './SearchChips'
import { SearchEmptyState } from './SearchEmptyState'

interface SearchBarProps {
  variant?: 'default' | 'enhanced' | 'mobile'
  placeholder?: string
  showChips?: boolean
  showEmptyState?: boolean
  onSearch?: (query: string) => void
  onRealTimeSearch?: (query: string) => void
  className?: string
}

export function SearchBar({
  variant = 'default',
  placeholder = 'Поиск по названию, тегам и жанрам — попробуйте: ambient, k-pop, регги',
  showChips = true,
  showEmptyState = true,
  onSearch,
  onRealTimeSearch,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [lastTrackedQuery, setLastTrackedQuery] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError
  } = useSearchSuggestions(query, { debounceMs: 300, maxResults: 6 })
  
  const { trackCompletedSearch } = useSearchTracking()
  
  // Горячая клавиша "/"
  useKeyboardShortcut('/', () => {
    inputRef.current?.focus()
  })
  
  // Real-time поиск с debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        // Вызываем real-time поиск
        onRealTimeSearch?.(query.trim())
      }, 300) // 300ms debounce
    } else {
      // Очистка поиска
      onRealTimeSearch?.('')
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, onRealTimeSearch])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    if (value.length === 1 && startTime === 0) {
      setStartTime(Date.now())
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsLoading(true)
      onSearch?.(query.trim())
      
      // Сброс состояния
      setTimeout(() => {
        setIsLoading(false)
        setStartTime(0)
      }, 1000)
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch?.(suggestion)
  }
  
  const handleClear = () => {
    setQuery('')
    setStartTime(0)
    setLastTrackedQuery('')
    inputRef.current?.focus()
    onRealTimeSearch?.('')
  }
  
  const handleFocus = () => {
    setIsFocused(true)
  }
  
  const handleBlur = () => {
    // Задержка для обработки клика по подсказке
    setTimeout(() => setIsFocused(false), 150)
  }
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'enhanced':
        return 'py-4 px-6 pl-12 pr-16'
      case 'mobile':
        return 'py-3 px-4 pl-10 pr-12'
      default:
        return 'py-3 px-4 pl-10 pr-12'
    }
  }
  
  return (
    <div className={`w-full max-w-3xl mx-auto px-4 relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full ${getVariantClasses()} rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all duration-200 focus:outline-none focus:border-purple-400 focus:shadow-lg hover:border-purple-300 placeholder-gray-400 text-gray-900`}
          aria-label="Поиск промптов"
          role="searchbox"
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Очистить поиск"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Индикатор загрузки при real-time поиске */}
        {query && isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          </div>
        )}
      </div>
      
      {/* Подсказки */}
      {isFocused && (suggestions.length > 0 || suggestionsLoading) && (
        <SearchSuggestionsList
          suggestions={suggestions}
          isLoading={suggestionsLoading}
          onSuggestionClick={handleSuggestionClick}
          query={query}
        />
      )}
      
      {/* Популярные чипы */}
      {isFocused && !query && showChips && (
        <SearchChips onChipClick={handleSuggestionClick} />
      )}
      
      {/* Пустое состояние */}
      {isFocused && !query && showEmptyState && (
        <SearchEmptyState onSuggestionClick={handleSuggestionClick} />
      )}
    </div>
  )
}
