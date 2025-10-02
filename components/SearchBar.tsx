'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics'
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
  className?: string
}

export function SearchBar({
  variant = 'default',
  placeholder = 'Поиск по названию, тегам и жанрам — попробуйте: ambient, k-pop, регги',
  showChips = true,
  showEmptyState = true,
  onSearch,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError
  } = useSearchSuggestions(query, { debounceMs: 300, maxResults: 6 })
  
  const { trackSearchEvent } = useSearchAnalytics()
  
  // Горячая клавиша "/"
  useKeyboardShortcut('/', () => {
    inputRef.current?.focus()
    trackSearchEvent('search_focused', { method: 'hotkey' })
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    if (value.length === 1 && startTime === 0) {
      setStartTime(Date.now())
      trackSearchEvent('search_started', { query: value })
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsLoading(true)
      const timeToSubmit = startTime > 0 ? Date.now() - startTime : 0
      
      trackSearchEvent('search_submitted', { 
        query: query.trim(),
        source: 'header_home',
        timeToSubmitMs: timeToSubmit
      })
      
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
    trackSearchEvent('suggestion_clicked', { 
      query: suggestion,
      suggestionId: suggestion,
      position: suggestions.indexOf(suggestion)
    })
    onSearch?.(suggestion)
  }
  
  const handleClear = () => {
    setQuery('')
    setStartTime(0)
    inputRef.current?.focus()
    trackSearchEvent('search_cleared')
  }
  
  const handleFocus = () => {
    setIsFocused(true)
    trackSearchEvent('search_focused', { method: 'click' })
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
      <form onSubmit={handleSubmit} className="relative">
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
              className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Очистить поиск"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 hover:from-purple-600 hover:to-indigo-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Найти'
            )}
          </button>
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
      </form>
    </div>
  )
}
