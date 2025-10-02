'use client'

import { TrendingUp } from 'lucide-react'

interface SearchChipsProps {
  onChipClick: (chip: string) => void
}

const POPULAR_CHIPS = [
  'ambient',
  'k-pop', 
  'phonk',
  'lofi',
  'meditation'
]

export function SearchChips({ onChipClick }: SearchChipsProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
      <div className="flex items-center mb-3">
        <TrendingUp className="w-4 h-4 text-gray-500 mr-2" />
        <span className="text-sm font-medium text-gray-700">Популярные запросы</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {POPULAR_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipClick(chip)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-700 rounded-full text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
