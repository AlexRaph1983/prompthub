'use client'

import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface SearchTrackingOptions {
  sessionId?: string
  debounceMs?: number
}

export function useSearchTracking(options: SearchTrackingOptions = {}) {
  const { sessionId = uuidv4(), debounceMs = 2000 } = options

  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    clickedResult?: string
  ) => {
    if (!query.trim()) {
      console.log('⚠️ Empty query, skipping tracking')
      return
    }

    // Фильтруем слишком короткие запросы (меньше 3 символов)
    if (query.trim().length < 3) {
      console.log('⚠️ Query too short, skipping tracking:', query)
      return
    }

    try {
      console.log('🔍 Tracking search:', { query, resultsCount, clickedResult, sessionId })
      console.log('🌐 Making request to /api/search-tracking')
      
      const response = await fetch('/api/search-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          resultsCount,
          clickedResult,
          sessionId,
        }),
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ Search tracked successfully:', result)
    } catch (error) {
      console.error('❌ Search tracking error:', error)
    }
  }, [sessionId])

  const trackSearchWithDebounce = useCallback(
    debounce((query: string, resultsCount: number) => {
      trackSearch(query, resultsCount)
    }, debounceMs),
    [trackSearch, debounceMs]
  )

  const trackClick = useCallback((query: string, resultsCount: number, clickedPromptId: string) => {
    trackSearch(query, resultsCount, clickedPromptId)
  }, [trackSearch])

  return {
    trackSearch: trackSearchWithDebounce, // Используем debounced версию по умолчанию
    trackSearchWithDebounce,
    trackClick,
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
