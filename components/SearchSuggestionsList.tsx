'use client'

import { Search, Loader2 } from 'lucide-react'

interface SearchSuggestionsListProps {
  suggestions: string[]
  isLoading: boolean
  onSuggestionClick: (suggestion: string) => void
  query: string
}

export function SearchSuggestionsList({
  suggestions,
  isLoading,
  onSuggestionClick,
  query
}: SearchSuggestionsListProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Поиск подсказок...</span>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div 
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
      role="listbox"
      aria-label="Поисковые подсказки"
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          onClick={() => onSuggestionClick(suggestion)}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
          role="option"
          aria-selected={false}
        >
          <div className="flex items-center">
            <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
            <span className="text-gray-900 truncate">
              {highlightMatch(suggestion, query)}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  )
}
