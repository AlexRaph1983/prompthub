'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    // Отключаем браузерное auto scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    // При смене pathname проверяем, нужно ли восстановить позицию
    const lastViewedPromptId = sessionStorage.getItem('lastViewedPromptId')
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')
    
    // Если есть сохранённые данные и мы НЕ на странице промпта
    if ((lastViewedPromptId || savedScrollPosition) && !pathname.includes('/prompt/')) {
      // Даём время на рендеринг страницы
      const timeout = setTimeout(() => {
        if (lastViewedPromptId) {
          const promptElement = document.querySelector(`[data-prompt-id="${lastViewedPromptId}"]`)
          if (promptElement) {
            const elementPosition = promptElement.getBoundingClientRect().top + window.scrollY
            const offsetPosition = elementPosition - 100
            window.scrollTo({ top: offsetPosition, behavior: 'instant' })
            sessionStorage.removeItem('lastViewedPromptId')
            sessionStorage.removeItem('scrollPosition')
            return
          }
        }
        if (savedScrollPosition) {
          window.scrollTo({ top: parseInt(savedScrollPosition, 10), behavior: 'instant' })
        }
        sessionStorage.removeItem('lastViewedPromptId')
        sessionStorage.removeItem('scrollPosition')
      }, 150)
      
      return () => clearTimeout(timeout)
    }
  }, [pathname])

  return null
}

