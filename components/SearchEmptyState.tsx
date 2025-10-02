'use client'

import { Lightbulb, Search } from 'lucide-react'

interface SearchEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

const EXAMPLE_QUERIES = [
  'ambient music',
  'k-pop beats',
  'meditation sounds',
  'lofi hip hop'
]

export function SearchEmptyState({ onSuggestionClick }: SearchEmptyStateProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400 mr-2" />
          <Lightbulb className="w-6 h-6 text-yellow-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Найти промпт
        </h3>
        
        <p className="text-gray-600 mb-4">
          Попробуйте: ambient, k-pop, регги
        </p>
        
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_QUERIES.map((query) => (
            <button
              key={query}
              onClick={() => onSuggestionClick(query)}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
