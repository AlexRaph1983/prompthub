import { useState, useEffect } from 'react'
import { useDebounce } from './useDebounce'

interface UseSearchSuggestionsOptions {
  debounceMs?: number
  maxResults?: number
}

export function useSearchSuggestions(
  query: string,
  options: UseSearchSuggestionsOptions = {}
) {
  const { debounceMs = 300, maxResults = 6 } = options
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const debouncedQuery = useDebounce(query, debounceMs)
  
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=${maxResults}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions')
        }
        
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSuggestions()
  }, [debouncedQuery, maxResults])
  
  return {
    suggestions,
    isLoading,
    error
  }
}
