'use client'

import { useState, useEffect } from 'react'

export function useSearch(initialValue: string = '', delay: number = 300) {
  const [searchValue, setSearchValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchValue, delay])

  return {
    searchValue,
    setSearchValue,
    debouncedValue,
  }
} 