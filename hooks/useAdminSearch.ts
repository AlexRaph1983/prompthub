'use client'

import { useCallback, useRef, useState } from 'react'
import { filterSearchQuery } from '@/lib/search-filtering'

interface AdminSearchOptions {
  debounceMs?: number
  onSearch?: (query: string, finished: boolean) => void
  onSuggestions?: (query: string) => void
}

export function useAdminSearch(options: AdminSearchOptions = {}) {
  const { debounceMs = 600, onSearch, onSuggestions } = options
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced функция для подсказок (без логирования)
  const debouncedSuggestions = useCallback(
    debounce((query: string) => {
      if (onSuggestions && query.trim()) {
        onSuggestions(query)
      }
    }, debounceMs),
    [onSuggestions, debounceMs]
  )

  // Обработка изменения ввода
  const handleInputChange = useCallback((value: string) => {
    setSearchValue(value)
    
    // Клиентская фильтрация
    const filtered = filterSearchQuery(value)
    
    if (filtered.isValid) {
      // Отправляем подсказки с debounce
      debouncedSuggestions(filtered.filtered)
    } else {
      // Очищаем подсказки для невалидных запросов
      if (onSuggestions) {
        onSuggestions('')
      }
    }
  }, [debouncedSuggestions, onSuggestions])

  // Обработка завершения поиска (Enter)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchSubmit()
    }
  }, [])

  // Обработка потери фокуса
  const handleBlur = useCallback(() => {
    handleSearchSubmit()
  }, [])

  // Отправка завершенного поиска
  const handleSearchSubmit = useCallback(() => {
    if (!searchValue.trim()) return
    
    // Клиентская фильтрация
    const filtered = filterSearchQuery(searchValue)
    
    if (!filtered.isValid) {
      console.log('❌ Search query filtered out:', filtered.reason)
      return
    }
    
    // Проверяем, что запрос изменился
    if (filtered.filtered === lastSearchQuery) {
      console.log('⚠️ Duplicate search query, skipping')
      return
    }
    
    setIsSearching(true)
    setLastSearchQuery(filtered.filtered)
    
    // Отправляем с флагом finished=true
    if (onSearch) {
      onSearch(filtered.filtered, true)
    }
    
    // Сбрасываем состояние поиска
    setTimeout(() => setIsSearching(false), 1000)
  }, [searchValue, lastSearchQuery, onSearch])

  // Очистка поиска
  const clearSearch = useCallback(() => {
    setSearchValue('')
    setLastSearchQuery('')
    if (onSearch) {
      onSearch('', false)
    }
    if (onSuggestions) {
      onSuggestions('')
    }
  }, [onSearch, onSuggestions])

  // Очистка debounce при размонтировании
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  return {
    searchValue,
    setSearchValue: handleInputChange,
    isSearching,
    handleKeyDown,
    handleBlur,
    clearSearch,
    cleanup
  }
}

// Простая реализация debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }) as T
}
