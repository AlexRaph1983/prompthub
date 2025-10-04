'use client'

import { useCallback, useRef } from 'react'
import { useSearchTracking } from './useSearchTracking'

export function useRealTimeSearchTracking() {
  const { trackCompletedSearch } = useSearchTracking()
  const debounceRef = useRef<NodeJS.Timeout>()
  const lastTrackedQuery = useRef<string>('')

  const trackRealTimeSearch = useCallback((
    query: string,
    resultsCount: number,
    debounceMs: number = 1000
  ) => {
    if (!query.trim()) return

    // Очищаем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Устанавливаем новый таймер
    debounceRef.current = setTimeout(() => {
      // Отслеживаем только если запрос изменился
      if (query.trim() !== lastTrackedQuery.current) {
        trackCompletedSearch(query, resultsCount)
        lastTrackedQuery.current = query.trim()
      }
    }, debounceMs)
  }, [trackCompletedSearch])

  return { trackRealTimeSearch }
}
