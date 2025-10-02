'use client'

import { useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { processSearchQuery } from '@/lib/search-utils'

interface SearchTrackingOptions {
  sessionId?: string
  debounceMs?: number
}

export function useSearchTracking(options: SearchTrackingOptions = {}) {
  const { sessionId = uuidv4(), debounceMs = 600 } = options
  const lastTrackedQuery = useRef<string>('')

  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    clickedResult?: string
  ) => {
    if (!query.trim()) {
      console.log('⚠️ Empty query, skipping tracking')
      return
    }

    // Обрабатываем запрос с нормализацией и валидацией
    const processed = processSearchQuery(query)
    
    if (!processed.valid) {
      console.log('⚠️ Invalid query, skipping tracking:', processed.reason)
      return
    }

    // Проверяем на дубликаты
    if (lastTrackedQuery.current === processed.processed) {
      console.log('⚠️ Duplicate query, skipping tracking:', processed.processed)
      return
    }

    try {
      console.log('🔍 Tracking search:', { 
        original: query, 
        processed: processed.processed, 
        resultsCount, 
        clickedResult, 
        sessionId 
      })
      
      const response = await fetch('/api/search-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: processed.processed,
          queryHash: processed.hash,
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
      
      // Сохраняем последний отслеженный запрос
      lastTrackedQuery.current = processed.processed
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

  // Отслеживание завершенного поиска (Enter или потеря фокуса)
  const trackCompletedSearch = useCallback((query: string, resultsCount: number) => {
    if (!query.trim()) return
    
    // Сбрасываем debounce и сразу отправляем
    trackSearch(query, resultsCount)
  }, [trackSearch])

  // Отслеживание только при потере фокуса (без debounce)
  const trackOnBlur = useCallback((query: string, resultsCount: number) => {
    if (!query.trim()) return
    
    // Немедленно отправляем без debounce
    trackSearch(query, resultsCount)
  }, [trackSearch])

  return {
    trackSearch: trackSearchWithDebounce, // Debounced для ввода
    trackSearchWithDebounce,
    trackCompletedSearch, // Для Enter
    trackOnBlur, // Для потери фокуса
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
