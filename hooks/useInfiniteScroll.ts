import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface UseInfiniteScrollOptions {
  initialPrompts: any[]
  initialPagination: PaginationInfo
  authorId?: string
  onLoadMore: (page: number) => Promise<{ prompts: any[], pagination: PaginationInfo }>
}

interface UseInfiniteScrollReturn {
  prompts: any[]
  pagination: PaginationInfo
  isLoading: boolean
  error: string | null
  hasNextPage: boolean
  loadMore: () => void
  setPrompts: (prompts: any[]) => void
  setPagination: (pagination: PaginationInfo) => void
  loadMoreRef: React.RefObject<HTMLDivElement>
}

export function useInfiniteScroll({
  initialPrompts,
  initialPagination,
  authorId,
  onLoadMore
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [prompts, setPrompts] = useState(initialPrompts)
  const [pagination, setPagination] = useState(initialPagination)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(initialPagination.hasNextPage)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage) return

    setIsLoading(true)
    setError(null)

    try {
      const nextPage = pagination.page + 1
      const result = await onLoadMore(nextPage)
      
      // Добавляем новые промпты, избегая дубликатов
      const existingIds = new Set(prompts.map(p => p.id))
      const newPrompts = result.prompts.filter(p => !existingIds.has(p.id))
      
      setPrompts(prev => [...prev, ...newPrompts])
      setPagination(result.pagination)
      setHasNextPage(result.pagination.hasNextPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more prompts')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasNextPage, pagination.page, prompts, onLoadMore])

  // Настройка IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isLoading) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasNextPage, isLoading, loadMore])

  // Сброс состояния при изменении authorId
  useEffect(() => {
    setPrompts(initialPrompts)
    setPagination(initialPagination)
    setHasNextPage(initialPagination.hasNextPage)
    setError(null)
  }, [authorId, initialPrompts, initialPagination])

  return {
    prompts,
    pagination,
    isLoading,
    error,
    hasNextPage,
    loadMore,
    setPrompts,
    setPagination,
    loadMoreRef,
  }
}
