'use client'

import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface SearchTrackingOptions {
  sessionId?: string
  debounceMs?: number
}

export function useSearchTracking(options: SearchTrackingOptions = {}) {
  const { sessionId = uuidv4(), debounceMs = 1000 } = options

  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    clickedResult?: string
  ) => {
    if (!query.trim()) return

    try {
      await fetch('/api/search-tracking', {
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
    } catch (error) {
      // Тихо игнорируем ошибки трекинга, чтобы не мешать основному функционалу
      console.debug('Search tracking error:', error)
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
    trackSearch: trackSearchWithDebounce,
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
