import { renderHook, act } from '@testing-library/react'
import { useSearchTracking } from '@/hooks/useSearchTracking'

// Mock fetch
global.fetch = jest.fn()

describe('useSearchTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
  })

  it('should track search with debounce', async () => {
    const { result } = renderHook(() => useSearchTracking({ debounceMs: 100 }))
    
    act(() => {
      result.current.trackSearch('hello world', 5)
    })

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150))

    expect(fetch).toHaveBeenCalledWith('/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: expect.any(String),
        resultsCount: 5,
        clickedResult: undefined,
        sessionId: expect.any(String)
      })
    })
  })

  it('should track completed search immediately', async () => {
    const { result } = renderHook(() => useSearchTracking())
    
    act(() => {
      result.current.trackCompletedSearch('hello world', 5)
    })

    expect(fetch).toHaveBeenCalledWith('/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: expect.any(String),
        resultsCount: 5,
        clickedResult: undefined,
        sessionId: expect.any(String)
      })
    })
  })

  it('should track on blur immediately', async () => {
    const { result } = renderHook(() => useSearchTracking())
    
    act(() => {
      result.current.trackOnBlur('hello world', 5)
    })

    expect(fetch).toHaveBeenCalledWith('/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: expect.any(String),
        resultsCount: 5,
        clickedResult: undefined,
        sessionId: expect.any(String)
      })
    })
  })

  it('should track click with prompt ID', async () => {
    const { result } = renderHook(() => useSearchTracking())
    
    act(() => {
      result.current.trackClick('hello world', 5, 'prompt-123')
    })

    expect(fetch).toHaveBeenCalledWith('/api/search-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'hello world',
        queryHash: expect.any(String),
        resultsCount: 5,
        clickedResult: 'prompt-123',
        sessionId: expect.any(String)
      })
    })
  })

  it('should not track empty query', async () => {
    const { result } = renderHook(() => useSearchTracking())
    
    act(() => {
      result.current.trackSearch('', 0)
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('should not track short query', async () => {
    const { result } = renderHook(() => useSearchTracking())
    
    act(() => {
      result.current.trackSearch('ab', 0)
    })

    expect(fetch).not.toHaveBeenCalled()
  })
})
