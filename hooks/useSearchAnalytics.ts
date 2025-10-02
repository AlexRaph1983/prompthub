import { useCallback } from 'react'

interface SearchEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export function useSearchAnalytics() {
  const trackSearchEvent = useCallback((event: string, properties: Record<string, any> = {}) => {
    const eventData: SearchEvent = {
      event,
      properties: {
        ...properties,
        userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
        sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : null,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }
    
    // Отправка в аналитику
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', event, properties)
      }
      
      // Custom analytics endpoint
      fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      }).catch(console.error)
    }
  }, [])
  
  return { trackSearchEvent }
}
