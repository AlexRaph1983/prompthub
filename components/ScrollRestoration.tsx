'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestoration() {
  const pathname = usePathname()
  const attemptRef = useRef<number>(0)

  const tryRestoreScroll = useCallback(() => {
    const lastViewedPromptId = sessionStorage.getItem('lastViewedPromptId')
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')
    
    if (!lastViewedPromptId && !savedScrollPosition) return false
    
    attemptRef.current++
    console.log(`[ScrollRestoration] Attempt ${attemptRef.current}, promptId: ${lastViewedPromptId}, scrollPos: ${savedScrollPosition}`)
    
    if (lastViewedPromptId) {
      const promptElement = document.querySelector(`[data-prompt-id="${lastViewedPromptId}"]`)
      console.log('[ScrollRestoration] Looking for element:', lastViewedPromptId, 'Found:', !!promptElement)
      
      if (promptElement) {
        const elementPosition = promptElement.getBoundingClientRect().top + window.scrollY
        const offsetPosition = Math.max(0, elementPosition - 100)
        console.log('[ScrollRestoration] Scrolling to element at:', offsetPosition)
        window.scrollTo({ top: offsetPosition, behavior: 'instant' })
        sessionStorage.removeItem('lastViewedPromptId')
        sessionStorage.removeItem('scrollPosition')
        return true
      }
    }
    
    // Fallback на сохранённую позицию после нескольких попыток или если элемент не найден
    if (attemptRef.current >= 3 && savedScrollPosition) {
      console.log('[ScrollRestoration] Fallback to saved position:', savedScrollPosition)
      window.scrollTo({ top: parseInt(savedScrollPosition, 10), behavior: 'instant' })
      sessionStorage.removeItem('lastViewedPromptId')
      sessionStorage.removeItem('scrollPosition')
      return true
    }
    
    return false
  }, [])

  const scheduleScrollRestore = useCallback(() => {
    attemptRef.current = 0
    // Серия попыток с увеличивающейся задержкой
    const delays = [0, 50, 100, 200, 300, 500, 800]
    delays.forEach((delay) => {
      setTimeout(() => {
        if (sessionStorage.getItem('lastViewedPromptId') || sessionStorage.getItem('scrollPosition')) {
          tryRestoreScroll()
        }
      }, delay)
    })
  }, [tryRestoreScroll])

  useEffect(() => {
    // Отключаем браузерное auto scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Слушаем popstate для кнопки "назад" браузера
    const handlePopState = () => {
      console.log('[ScrollRestoration] popstate event fired')
      // Небольшая задержка чтобы дать Next.js обновить DOM
      setTimeout(() => {
        if (!window.location.pathname.includes('/prompt/')) {
          scheduleScrollRestore()
        }
      }, 10)
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [scheduleScrollRestore])

  // Также проверяем при изменении pathname (для router.back())
  useEffect(() => {
    const isOnPromptPage = pathname.includes('/prompt/')
    console.log('[ScrollRestoration] pathname effect:', pathname, 'isOnPromptPage:', isOnPromptPage)
    
    if (!isOnPromptPage) {
      const lastViewedPromptId = sessionStorage.getItem('lastViewedPromptId')
      const savedScrollPosition = sessionStorage.getItem('scrollPosition')
      
      if (lastViewedPromptId || savedScrollPosition) {
        console.log('[ScrollRestoration] Found saved data, scheduling restore')
        scheduleScrollRestore()
      }
    }
  }, [pathname, scheduleScrollRestore])

  return null
}

