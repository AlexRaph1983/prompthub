/**
 * Улучшенная система поиска с нормализацией текста
 * Поддерживает поиск по авторам, нормализацию, нечувствительность к регистру
 */

import { prisma } from '@/lib/prisma'

export interface EnhancedSearchParams {
  query: string
  limit?: number
  cursor?: string | null
  sort?: 'createdAt' | 'rating' | 'views' | 'relevance'
  order?: 'asc' | 'desc'
  authorId?: string
  category?: string
  model?: string
  lang?: string
  tags?: string[]
}

export interface EnhancedSearchResult {
  items: any[]
  nextCursor: string | null
  hasMore: boolean
  totalCount?: number
  searchMetadata?: {
    normalizedQuery: string
    searchTerms: string[]
    authorMatches: number
    titleMatches: number
    descriptionMatches: number
    tagMatches: number
  }
}

/**
 * Нормализация текста для поиска
 */
export function normalizeSearchText(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    // Убираем лишние пробелы
    .replace(/\s+/g, ' ')
    // Убираем специальные символы, оставляем только буквы, цифры и пробелы
    .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
    // Убираем повторяющиеся пробелы
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Разбивает поисковый запрос на отдельные термины
 */
export function extractSearchTerms(query: string): string[] {
  const normalized = normalizeSearchText(query)
  return normalized
    .split(' ')
    .filter(term => term.length > 0)
    .filter(term => term.length >= 2) // Игнорируем слишком короткие термины
}

/**
 * Создает условия поиска для Prisma
 */
export function buildSearchConditions(query: string, searchTerms: string[]) {
  const normalizedQuery = normalizeSearchText(query)
  
  return {
    OR: [
      // Точное совпадение в заголовке (высший приоритет)
      { title: { contains: normalizedQuery } },
      // Точное совпадение в описании
      { description: { contains: normalizedQuery } },
      // Точное совпадение в тегах
      { tags: { contains: normalizedQuery } },
      // Поиск по отдельным терминам в заголовке
      ...searchTerms.map(term => ({
        title: { contains: term }
      })),
      // Поиск по отдельным терминам в описании
      ...searchTerms.map(term => ({
        description: { contains: term }
      })),
      // Поиск по отдельным терминам в тегах
      ...searchTerms.map(term => ({
        tags: { contains: term }
      })),
      // Поиск по имени автора
      {
        author: {
          name: { contains: normalizedQuery }
        }
      },
      // Поиск по отдельным терминам в имени автора
      ...searchTerms.map(term => ({
        author: {
          name: { contains: term }
        }
      }))
    ]
  }
}

/**
 * Вычисляет релевантность результата поиска
 */
export function calculateRelevanceScore(prompt: any, searchTerms: string[]): number {
  let score = 0
  const title = normalizeSearchText(prompt.title || '')
  const description = normalizeSearchText(prompt.description || '')
  const tags = normalizeSearchText(prompt.tags || '')
  const authorName = normalizeSearchText(prompt.author?.name || '')
  
  // Веса для разных полей
  const weights = {
    title: 10,
    description: 5,
    tags: 8,
    author: 6
  }
  
  searchTerms.forEach(term => {
    // Точное совпадение в заголовке
    if (title.includes(term)) {
      score += weights.title
    }
    
    // Точное совпадение в описании
    if (description.includes(term)) {
      score += weights.description
    }
    
    // Точное совпадение в тегах
    if (tags.includes(term)) {
      score += weights.tags
    }
    
    // Точное совпадение в имени автора
    if (authorName.includes(term)) {
      score += weights.author
    }
  })
  
  return score
}

/**
 * Основная функция улучшенного поиска
 */
export async function enhancedSearch(params: EnhancedSearchParams): Promise<EnhancedSearchResult> {
  const {
    query,
    limit = 20,
    cursor = null,
    sort = 'relevance',
    order = 'desc',
    authorId,
    category,
    model,
    lang,
    tags
  } = params

  if (!query || query.trim().length < 2) {
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
      searchMetadata: {
        normalizedQuery: '',
        searchTerms: [],
        authorMatches: 0,
        titleMatches: 0,
        descriptionMatches: 0,
        tagMatches: 0
      }
    }
  }

  const searchTerms = extractSearchTerms(query)
  const searchConditions = buildSearchConditions(query, searchTerms)
  
  // Базовые условия
  const where: any = {
    AND: [
      searchConditions
    ]
  }

  // Дополнительные фильтры
  if (authorId) {
    where.AND.push({ authorId })
  }

  if (category) {
    where.AND.push({ category })
  }

  if (model) {
    where.AND.push({ model })
  }

  if (lang) {
    where.AND.push({ lang })
  }

  if (tags && tags.length > 0) {
    where.AND.push({
      tags: {
        contains: tags.join(',')
      }
    })
  }

  // Cursor-based pagination
  if (cursor) {
    const cursorPrompt = await prisma.prompt.findUnique({
      where: { id: cursor },
      select: { createdAt: true, id: true }
    })

    if (cursorPrompt) {
      const cursorCondition = order === 'asc' 
        ? { 
            OR: [
              { createdAt: { gt: cursorPrompt.createdAt } },
              { 
                createdAt: cursorPrompt.createdAt,
                id: { gt: cursorPrompt.id }
              }
            ]
          }
        : {
            OR: [
              { createdAt: { lt: cursorPrompt.createdAt } },
              { 
                createdAt: cursorPrompt.createdAt,
                id: { lt: cursorPrompt.id }
              }
            ]
          }
      
      where.AND.push(cursorCondition)
    }
  }

  // Определяем порядок сортировки
  let orderBy: any[]
  
  if (sort === 'relevance') {
    // Для релевантности сначала получаем все результаты, затем сортируем
    orderBy = [{ createdAt: 'desc' as const }]
  } else {
    switch (sort) {
      case 'rating':
        orderBy = [
          { averageRating: order as 'asc' | 'desc' },
          { createdAt: 'desc' as const },
          { id: 'desc' as const }
        ]
        break
      case 'views':
        orderBy = [
          { views: order as 'asc' | 'desc' },
          { createdAt: 'desc' as const },
          { id: 'desc' as const }
        ]
        break
      case 'createdAt':
      default:
        orderBy = [
          { createdAt: order as 'asc' | 'desc' },
          { id: 'desc' as const }
        ]
    }
  }

  // Выполняем запрос
  const prompts = await prisma.prompt.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          website: true,
          telegram: true,
          github: true,
          twitter: true,
          linkedin: true,
          reputationScore: true,
          reputationPromptCount: true,
          reputationRatingsCnt: true,
          reputationLikesCnt: true,
          reputationSavesCnt: true,
          reputationCommentsCnt: true,
        },
      },
      _count: { 
        select: { 
          ratings: true, 
          likes: true, 
          saves: true, 
          comments: true 
        } 
      },
      ratings: { select: { value: true } },
    },
    orderBy,
    take: limit + 1, // Берем на один больше для определения hasMore
  })

  // Если сортировка по релевантности, вычисляем и сортируем
  let processedPrompts = prompts
  if (sort === 'relevance') {
    processedPrompts = prompts
      .map(prompt => ({
        ...prompt,
        relevanceScore: calculateRelevanceScore(prompt, searchTerms)
      }))
      .sort((a, b) => {
        if (order === 'asc') {
          return a.relevanceScore - b.relevanceScore
        } else {
          return b.relevanceScore - a.relevanceScore
        }
      })
  }

  // Определяем hasMore и nextCursor
  const hasMore = processedPrompts.length > limit
  const items = hasMore ? processedPrompts.slice(0, limit) : processedPrompts
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null

  // Подсчитываем метаданные поиска
  const searchMetadata = {
    normalizedQuery: normalizeSearchText(query),
    searchTerms,
    authorMatches: items.filter(item => 
      normalizeSearchText(item.author?.name || '').includes(normalizeSearchText(query))
    ).length,
    titleMatches: items.filter(item => 
      normalizeSearchText(item.title || '').includes(normalizeSearchText(query))
    ).length,
    descriptionMatches: items.filter(item => 
      normalizeSearchText(item.description || '').includes(normalizeSearchText(query))
    ).length,
    tagMatches: items.filter(item => 
      normalizeSearchText(item.tags || '').includes(normalizeSearchText(query))
    ).length,
  }

  return {
    items,
    nextCursor,
    hasMore,
    searchMetadata
  }
}
