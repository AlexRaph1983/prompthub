import { renderHook, act } from '@testing-library/react'
import { useAdminSearch } from '@/hooks/useAdminSearch'

// Mock search filtering
jest.mock('@/lib/search-filtering', () => ({
  filterSearchQuery: jest.fn((query) => ({
    filtered: query,
    isValid: query.length >= 2,
    reason: query.length < 2 ? 'INSUFFICIENT_LETTERS' : undefined
  }))
}))

describe('useAdminSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with empty search value', () => {
    const { result } = renderHook(() => useAdminSearch())
    
    expect(result.current.searchValue).toBe('')
    expect(result.current.isSearching).toBe(false)
  })

  it('should update search value on input change', () => {
    const { result } = renderHook(() => useAdminSearch())
    
    act(() => {
      result.current.setSearchValue('test query')
    })
    
    expect(result.current.searchValue).toBe('test query')
  })

  it('should call onSearch with finished=true on Enter', () => {
    const onSearch = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch }))
    
    act(() => {
      result.current.setSearchValue('valid query')
    })
    
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      } as any)
    })
    
    expect(onSearch).toHaveBeenCalledWith('valid query', true)
  })

  it('should call onSearch with finished=true on blur', () => {
    const onSearch = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch }))
    
    act(() => {
      result.current.setSearchValue('valid query')
    })
    
    act(() => {
      result.current.handleBlur()
    })
    
    expect(onSearch).toHaveBeenCalledWith('valid query', true)
  })

  it('should not call onSearch for invalid queries', () => {
    const onSearch = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch }))
    
    act(() => {
      result.current.setSearchValue('a') // Too short
    })
    
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      } as any)
    })
    
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('should not call onSearch for empty queries', () => {
    const onSearch = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch }))
    
    act(() => {
      result.current.setSearchValue('')
    })
    
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      } as any)
    })
    
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('should not call onSearch for duplicate queries', () => {
    const onSearch = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch }))
    
    act(() => {
      result.current.setSearchValue('test query')
    })
    
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      } as any)
    })
    
    expect(onSearch).toHaveBeenCalledTimes(1)
    
    // Try same query again
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      } as any)
    })
    
    expect(onSearch).toHaveBeenCalledTimes(1) // Still only once
  })

  it('should call onSuggestions with debounce', async () => {
    const onSuggestions = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSuggestions }))
    
    act(() => {
      result.current.setSearchValue('test')
    })
    
    // Should not be called immediately
    expect(onSuggestions).not.toHaveBeenCalled()
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 700))
    
    expect(onSuggestions).toHaveBeenCalledWith('test')
  })

  it('should clear search correctly', () => {
    const onSearch = jest.fn()
    const onSuggestions = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch, onSuggestions }))
    
    act(() => {
      result.current.setSearchValue('test query')
    })
    
    act(() => {
      result.current.clearSearch()
    })
    
    expect(result.current.searchValue).toBe('')
    expect(onSearch).toHaveBeenCalledWith('', false)
    expect(onSuggestions).toHaveBeenCalledWith('')
  })

  it('should set isSearching state correctly', () => {
    const onSearch = jest.fn()
    const { result } = renderHook(() => useAdminSearch({ onSearch }))
    
    act(() => {
      result.current.setSearchValue('valid query')
    })
    
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn()
      } as any)
    })
    
    expect(result.current.isSearching).toBe(true)
    
    // Wait for timeout
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    expect(result.current.isSearching).toBe(false)
  })
})
