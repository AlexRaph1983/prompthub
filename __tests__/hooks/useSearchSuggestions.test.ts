import { renderHook, waitFor } from '@testing-library/react'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'

// Мокаем fetch
global.fetch = jest.fn()

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty suggestions for short queries', () => {
    const { result } = renderHook(() => useSearchSuggestions('a'))
    
    expect(result.current.suggestions).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should fetch suggestions for valid queries', async () => {
    const mockResponse = {
      suggestions: ['ambient music', 'ambient sounds']
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useSearchSuggestions('ambient'))

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(['ambient music', 'ambient sounds'])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSearchSuggestions('test'))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
      expect(result.current.suggestions).toEqual([])
    })
  })

  it('should debounce queries', async () => {
    const { result, rerender } = renderHook(
      ({ query }) => useSearchSuggestions(query),
      { initialProps: { query: 'a' } }
    )

    // Быстро меняем запрос
    rerender({ query: 'ab' })
    rerender({ query: 'abc' })
    rerender({ query: 'abcd' })

    // Должен быть только один вызов fetch после debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
