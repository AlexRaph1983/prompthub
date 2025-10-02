export interface SearchEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
}

export const SEARCH_EVENTS = {
  SEARCH_FOCUSED: 'search_focused',
  SEARCH_STARTED: 'search_started', 
  SEARCH_SUBMITTED: 'search_submitted',
  SUGGESTION_CLICKED: 'suggestion_clicked',
  SEARCH_CLEARED: 'search_cleared'
} as const

export type SearchEventType = typeof SEARCH_EVENTS[keyof typeof SEARCH_EVENTS]

export function createSearchEvent(
  event: SearchEventType,
  properties: Record<string, any> = {}
): SearchEvent {
  return {
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
}
