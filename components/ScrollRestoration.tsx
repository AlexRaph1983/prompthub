'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestoration() {
  const pathname = usePathname()
  const prevPathRef = useRef<string>(pathname)
  const attemptRef = useRef<number>(0)

  useEffect(() => {
    // Отключаем браузерное auto scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const prevPath = prevPathRef.current
    prevPathRef.current = pathname
    
    const lastViewedPromptId = sessionStorage.getItem('lastViewedPromptId')
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')
    
    console.log('[ScrollRestoration] pathname changed:', { prevPath, pathname, lastViewedPromptId, savedScrollPosition })
    
    // Если перешли СО страницы промпта на другую страницу
    const wasOnPromptPage = prevPath.includes('/prompt/')
    const isOnPromptPage = pathname.includes('/prompt/')
    
    if (wasOnPromptPage && !isOnPromptPage) {
      console.log('[ScrollRestoration] Detected navigation from prompt page, attempting scroll restore')
      
      if (lastViewedPromptId || savedScrollPosition) {
        attemptRef.current = 0
        
        const tryRestoreScroll = () => {
          attemptRef.current++
          console.log(`[ScrollRestoration] Attempt ${attemptRef.current}`)
          
          if (lastViewedPromptId) {
            const promptElement = document.querySelector(`[data-prompt-id="${lastViewedPromptId}"]`)
            console.log('[ScrollRestoration] Looking for element:', lastViewedPromptId, 'Found:', !!promptElement)
            
            if (promptElement) {
              const elementPosition = promptElement.getBoundingClientRect().top + window.scrollY
              const offsetPosition = Math.max(0, elementPosition - 100)
              console.log('[ScrollRestoration] Scrolling to:', offsetPosition)
              window.scrollTo({ top: offsetPosition, behavior: 'instant' })
              sessionStorage.removeItem('lastViewedPromptId')
              sessionStorage.removeItem('scrollPosition')
              return true
            }
          }
          
          // Fallback на сохранённую позицию после нескольких попыток
          if (attemptRef.current >= 3 && savedScrollPosition) {
            console.log('[ScrollRestoration] Fallback to saved position:', savedScrollPosition)
            window.scrollTo({ top: parseInt(savedScrollPosition, 10), behavior: 'instant' })
            sessionStorage.removeItem('lastViewedPromptId')
            sessionStorage.removeItem('scrollPosition')
            return true
          }
          
          return false
        }
        
        // Серия попыток с увеличивающейся задержкой
        const delays = [50, 100, 200, 300, 500]
        delays.forEach((delay, index) => {
          setTimeout(() => {
            if (sessionStorage.getItem('lastViewedPromptId') || sessionStorage.getItem('scrollPosition')) {
              tryRestoreScroll()
            }
          }, delay)
        })
      }
    }
  }, [pathname])

  return null
}

