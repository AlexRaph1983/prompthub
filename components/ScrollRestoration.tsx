'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestoration() {
  const pathname = usePathname()

  // Разрешаем восстановление скролла только на страницах со списком промптов
  // (чтобы не ломать другие разделы сайта)
  const isPromptListPath = useCallback((path: string) => {
    // Ожидаемые пути: /ru/prompts, /ru/category/..., /ru/tag/...
    // но поддержим и вариант без префикса локали на всякий случай
    const segments = path.split('/').filter(Boolean) // '' '/ru/home' -> ['ru','home']
    if (segments.length === 0) return false
    const first = segments[0]
    const second = segments[1]

    // Вариант с локалью: /{locale}/{section}
    const section = segments.length > 1 && (first.length === 2 || first.length === 5)
      ? second
      : first

    // ВАЖНО: 'home' здесь намеренно НЕ учитываем — для /home есть отдельная
    // локальная логика восстановления скролла, чтобы не конфликтовать
    // с более сложной структурой и виджетами на главной.
    return section === 'prompts' || section === 'category' || section === 'tag'
  }, [])
  const attemptRef = useRef<number>(0)
  const restoredRef = useRef<boolean>(false)

  const tryRestoreScroll = useCallback((forcePosition?: number) => {
    const lastViewedPromptId = sessionStorage.getItem('lastViewedPromptId')
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')
    
    if (!lastViewedPromptId && !savedScrollPosition && forcePosition === undefined) return false
    
    attemptRef.current++
    
    let targetPosition: number | null = null
    
    if (lastViewedPromptId) {
      const promptElement = document.querySelector(`[data-prompt-id="${lastViewedPromptId}"]`)
      
      if (promptElement) {
        const elementPosition = promptElement.getBoundingClientRect().top + window.scrollY
        targetPosition = Math.max(0, elementPosition - 100)
        console.log('[ScrollRestoration] Found element, target:', targetPosition)
      }
    }
    
    // Fallback на сохранённую позицию
    if (targetPosition === null && (attemptRef.current >= 2 || forcePosition !== undefined)) {
      const pos = forcePosition ?? (savedScrollPosition ? parseInt(savedScrollPosition, 10) : null)
      if (pos !== null) {
        targetPosition = pos
        console.log('[ScrollRestoration] Using fallback position:', targetPosition)
      }
    }
    
    if (targetPosition !== null && targetPosition > 0) {
      window.scrollTo(0, targetPosition)
      restoredRef.current = true
      sessionStorage.removeItem('lastViewedPromptId')
      sessionStorage.removeItem('scrollPosition')
      return true
    }
    
    return false
  }, [])

  const scheduleScrollRestore = useCallback(() => {
    attemptRef.current = 0
    restoredRef.current = false
    
    const savedPos = sessionStorage.getItem('scrollPosition')
    const targetPos = savedPos ? parseInt(savedPos, 10) : 0
    
    console.log('[ScrollRestoration] Starting restore, target:', targetPos)
    
    // Немедленная попытка скроллить к сохранённой позиции
    if (targetPos > 0) {
      window.scrollTo(0, targetPos)
    }
    
    // Серия попыток найти элемент и скроллить к нему
    const delays = [50, 100, 150, 200, 300, 500]
    delays.forEach((delay) => {
      setTimeout(() => {
        if (!restoredRef.current && (sessionStorage.getItem('lastViewedPromptId') || sessionStorage.getItem('scrollPosition'))) {
          tryRestoreScroll()
        }
      }, delay)
    })
    
    // Финальный fallback - принудительно установить позицию
    setTimeout(() => {
      if (!restoredRef.current && targetPos > 0) {
        console.log('[ScrollRestoration] Final fallback to:', targetPos)
        window.scrollTo(0, targetPos)
        sessionStorage.removeItem('lastViewedPromptId')
        sessionStorage.removeItem('scrollPosition')
        restoredRef.current = true
      }
    }, 600)
  }, [tryRestoreScroll])

  useEffect(() => {
    // Отключаем браузерное auto scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Слушаем popstate для кнопки "назад" браузера
    const handlePopState = () => {
      console.log('[ScrollRestoration] popstate event')
      setTimeout(() => {
        const path = window.location.pathname

        // Если это не страница со списком промптов — просто очищаем состояние,
        // чтобы не тянуть пользователя вниз на других страницах
        if (!isPromptListPath(path)) {
          sessionStorage.removeItem('lastViewedPromptId')
          sessionStorage.removeItem('scrollPosition')
          return
        }

        if (!path.includes('/prompt/')) {
          scheduleScrollRestore()
        }
      }, 0)
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [scheduleScrollRestore])

  // Проверяем при изменении pathname
  useEffect(() => {
    const isOnPromptPage = pathname.includes('/prompt/')

    if (isOnPromptPage) return

    const lastViewedPromptId = sessionStorage.getItem('lastViewedPromptId')
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')

    if (!lastViewedPromptId && !savedScrollPosition) return

    // Если пришли на не-поддерживаемую страницу, просто очищаем состояние
    if (!isPromptListPath(pathname)) {
      console.log('[ScrollRestoration] Non-list path, clearing saved scroll state for:', pathname)
      sessionStorage.removeItem('lastViewedPromptId')
      sessionStorage.removeItem('scrollPosition')
      return
    }

    console.log('[ScrollRestoration] pathname changed, scheduling restore for:', pathname)
    scheduleScrollRestore()
  }, [pathname, scheduleScrollRestore, isPromptListPath])

  return null
}

