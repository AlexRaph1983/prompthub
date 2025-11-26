'use client'

import { useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { processSearchQuery } from '@/lib/search-utils'

interface SearchTrackingOptions {
  sessionId?: string
  debounceMs?: number
}

export function useSearchTracking(options: SearchTrackingOptions = {}) {
  const { sessionId = uuidv4(), debounceMs = 3000 } = options
  const lastTrackedQuery = useRef<string>('')

  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    clickedResult?: string,
    finished: boolean = false
  ) => {
    if (!query.trim()) {
      console.log('⚠️ Empty query, skipping tracking')
      return
    }

    try {
      console.log('🔍 Tracking search:', { 
        query, 
        resultsCount, 
        clickedResult, 
        finished,
        sessionId 
      })
      
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
          finished
        }),
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        
        // Логируем причину отклонения
        if (errorData.reason) {
          console.log(`❌ Query rejected: ${errorData.reason}`, errorData.metrics)
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ Search tracked successfully:', result)
      
      // Сохраняем последний отслеженный запрос
      lastTrackedQuery.current = query.trim()
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
    
    // Отправляем с флагом finished=true
    trackSearch(query, resultsCount, undefined, true)
  }, [trackSearch])

  // Отслеживание только при потере фокуса (без debounce)
  const trackOnBlur = useCallback((query: string, resultsCount: number) => {
    if (!query.trim()) return
    
    // Отправляем с флагом finished=true
    trackSearch(query, resultsCount, undefined, true)
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
