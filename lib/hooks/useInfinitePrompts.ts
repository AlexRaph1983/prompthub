import { useInfiniteQuery } from '@tanstack/react-query'
import { PromptCardDTO } from '@/lib/repositories/promptRepository'

interface PromptListParams {
  authorId?: string
  search?: string
  category?: string
  model?: string
  lang?: string
  tags?: string[]
  sort?: 'createdAt' | 'rating' | 'views'
  order?: 'asc' | 'desc'
}

interface PromptListResult {
  items: PromptCardDTO[]
  nextCursor: string | null
  hasMore: boolean
  totalCount?: number
}

async function fetchPrompts(params: PromptListParams & { cursor?: string | null }): Promise<PromptListResult> {
  const searchParams = new URLSearchParams()
  
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.authorId) searchParams.set('authorId', params.authorId)
  if (params.search) searchParams.set('q', params.search)
  if (params.category) searchParams.set('category', params.category)
  if (params.model) searchParams.set('model', params.model)
  if (params.lang) searchParams.set('lang', params.lang)
  if (params.tags?.length) searchParams.set('tags', params.tags.join(','))
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.order) searchParams.set('order', params.order)
  
  searchParams.set('limit', '20')

  const response = await fetch(`/api/prompts?${searchParams}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch prompts: ${response.statusText}`)
  }
  
  return response.json()
}

export function useInfinitePrompts(params: PromptListParams = {}) {
  return useInfiniteQuery({
    queryKey: ['prompts', params],
    queryFn: ({ pageParam }) => fetchPrompts({ ...params, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
