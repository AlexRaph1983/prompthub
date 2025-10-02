import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '@/components/SearchBar'

// Мокаем хуки
jest.mock('@/hooks/useSearchSuggestions', () => ({
  useSearchSuggestions: () => ({
    suggestions: ['ambient music', 'k-pop beats'],
    isLoading: false,
    error: null
  })
}))

jest.mock('@/hooks/useSearchAnalytics', () => ({
  useSearchAnalytics: () => ({
    trackSearchEvent: jest.fn()
  })
}))

describe('SearchBar', () => {
  it('should render search input', () => {
    render(<SearchBar />)
    
    const input = screen.getByRole('searchbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Поиск по названию, тегам и жанрам — попробуйте: ambient, k-pop, регги')
  })

  it('should focus on "/" key press', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    
    const input = screen.getByRole('searchbox')
    
    await user.keyboard('/')
    
    expect(input).toHaveFocus()
  })

  it('should show suggestions when typing', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'ambient')
    
    await waitFor(() => {
      expect(screen.getByText('ambient music')).toBeInTheDocument()
    })
  })

  it('should submit search on Enter', async () => {
    const onSearch = jest.fn()
    const user = userEvent.setup()
    render(<SearchBar onSearch={onSearch} />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'test query')
    await user.keyboard('{Enter}')
    
    expect(onSearch).toHaveBeenCalledWith('test query')
  })

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'test')
    
    const clearButton = screen.getByLabelText('Очистить поиск')
    await user.click(clearButton)
    
    expect(input).toHaveValue('')
  })

  it('should show popular chips when focused and empty', async () => {
    const user = userEvent.setup()
    render(<SearchBar showChips={true} />)
    
    const input = screen.getByRole('searchbox')
    await user.click(input)
    
    expect(screen.getByText('Популярные запросы')).toBeInTheDocument()
    expect(screen.getByText('ambient')).toBeInTheDocument()
  })

  it('should show empty state when focused and empty', async () => {
    const user = userEvent.setup()
    render(<SearchBar showEmptyState={true} />)
    
    const input = screen.getByRole('searchbox')
    await user.click(input)
    
    expect(screen.getByText('Найти промпт')).toBeInTheDocument()
  })

  it('should handle suggestion clicks', async () => {
    const onSearch = jest.fn()
    const user = userEvent.setup()
    render(<SearchBar onSearch={onSearch} />)
    
    const input = screen.getByRole('searchbox')
    await user.type(input, 'ambient')
    
    await waitFor(() => {
      const suggestion = screen.getByText('ambient music')
      user.click(suggestion)
    })
    
    expect(onSearch).toHaveBeenCalledWith('ambient music')
  })
})
