'use client'

import { useCallback } from 'react'

// Создаем кастомное событие для обновления статистики
const STATS_REFRESH_EVENT = 'stats-refresh'

export function useStatsRefresh() {
  const refreshStats = useCallback(() => {
    // Отправляем кастомное событие для обновления статистики
    window.dispatchEvent(new CustomEvent(STATS_REFRESH_EVENT))
  }, [])

  return { refreshStats }
}

// Экспортируем константу события для использования в других компонентах
export { STATS_REFRESH_EVENT }
