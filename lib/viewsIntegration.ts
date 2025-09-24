/**
 * Интеграция системы просмотров с рейтингами и рекомендациями
 */

import { prisma } from '@/lib/prisma'
import { recomputeAllPromptVectors } from '@/lib/recommend'

export interface ViewsMetrics {
  promptId: string
  views: number
  viewsWeight: number // Вес для системы рекомендаций (0-1)
  popularityScore: number // Общий показатель популярности
}

/**
 * Вычисляет вес просмотров для системы рекомендаций
 */
export function calculateViewsWeight(views: number, maxViews: number = 1000): number {
  if (views <= 0) return 0
  // Логарифмическое масштабирование для предотвращения доминирования популярных промптов
  const normalizedViews = Math.min(views, maxViews)
  return Math.log(normalizedViews + 1) / Math.log(maxViews + 1)
}

/**
 * Вычисляет общий показатель популярности
 */
export function calculatePopularityScore(metrics: {
  views: number
  rating: number
  ratingCount: number
  likesCount: number
  savesCount: number
}): number {
  const { views, rating, ratingCount, likesCount, savesCount } = metrics
  
  // Веса для разных метрик
  const viewsWeight = 0.3
  const ratingWeight = 0.4
  const engagementWeight = 0.3
  
  // Нормализация просмотров (логарифмическая)
  const normalizedViews = views > 0 ? Math.log(views + 1) / 10 : 0
  
  // Нормализация рейтинга с учетом количества оценок
  const normalizedRating = ratingCount > 0 ? 
    (rating / 5) * Math.min(ratingCount / 10, 1) : 0
  
  // Нормализация вовлеченности
  const totalEngagement = likesCount + savesCount
  const normalizedEngagement = totalEngagement > 0 ? 
    Math.log(totalEngagement + 1) / 5 : 0
  
  const score = (
    normalizedViews * viewsWeight +
    normalizedRating * ratingWeight +
    normalizedEngagement * engagementWeight
  )
  
  return Math.min(score, 1) // Ограничиваем максимум единицей
}

/**
 * Обновляет метрики популярности для промпта
 */
export async function updatePromptPopularityMetrics(promptId: string): Promise<void> {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        _count: {
          select: { 
            ratings: true, 
            likes: true, 
            saves: true 
          }
        },
        ratings: {
          select: { value: true }
        }
      }
    })
    
    if (!prompt) return
    
    // Вычисляем средний рейтинг
    const avgRating = prompt.ratings.length > 0 
      ? prompt.ratings.reduce((sum, r) => sum + r.value, 0) / prompt.ratings.length 
      : 0
    
    const popularityScore = calculatePopularityScore({
      views: prompt.views,
      rating: avgRating,
      ratingCount: prompt._count.ratings,
      likesCount: prompt._count.likes,
      savesCount: prompt._count.saves
    })
    
    // Обновляем кэшированные значения
    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        averageRating: avgRating,
        totalRatings: prompt._count.ratings,
        // Можно добавить поле popularityScore в схему если нужно
      }
    })
    
    console.log(`Updated popularity metrics for prompt ${promptId}: views=${prompt.views}, score=${popularityScore.toFixed(3)}`)
    
  } catch (error) {
    console.error(`Failed to update popularity metrics for prompt ${promptId}:`, error)
  }
}

/**
 * Пакетное обновление метрик популярности
 */
export async function batchUpdatePopularityMetrics(promptIds: string[]): Promise<void> {
  console.log(`Updating popularity metrics for ${promptIds.length} prompts...`)
  
  const promises = promptIds.map(id => updatePromptPopularityMetrics(id))
  await Promise.allSettled(promises)
  
  console.log('Batch popularity metrics update completed')
}

/**
 * Получает топ популярные промпты с учетом просмотров
 */
export async function getPopularPrompts(limit: number = 10): Promise<Array<{
  id: string
  title: string
  views: number
  rating: number
  popularityScore: number
}>> {
  const prompts = await prisma.prompt.findMany({
    select: {
      id: true,
      title: true,
      views: true,
      averageRating: true,
      totalRatings: true,
      _count: {
        select: { likes: true, saves: true }
      }
    },
    orderBy: [
      { views: 'desc' },
      { averageRating: 'desc' },
      { createdAt: 'desc' }
    ],
    take: limit * 2 // Берем больше для более точной сортировки
  })
  
  const withScores = prompts.map(prompt => {
    const popularityScore = calculatePopularityScore({
      views: prompt.views,
      rating: prompt.averageRating || 0,
      ratingCount: prompt.totalRatings || 0,
      likesCount: prompt._count.likes,
      savesCount: prompt._count.saves
    })
    
    return {
      id: prompt.id,
      title: prompt.title,
      views: prompt.views,
      rating: prompt.averageRating || 0,
      popularityScore
    }
  })
  
  // Сортируем по показателю популярности
  return withScores
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit)
}

/**
 * Интеграция с системой рекомендаций при обновлении просмотров
 */
export async function onViewsUpdated(promptId: string, newViewsCount: number): Promise<void> {
  try {
    // 1. Обновляем метрики популярности
    await updatePromptPopularityMetrics(promptId)
    
    // 2. Если просмотры значительно изменились, пересчитываем векторы рекомендаций
    if (newViewsCount > 0 && newViewsCount % 10 === 0) {
      // Пересчитываем векторы каждые 10 просмотров
      Promise.resolve(recomputeAllPromptVectors()).catch(error => {
        console.error('Failed to recompute recommendation vectors:', error)
      })
    }
    
    console.log(`Views integration completed for prompt ${promptId}: ${newViewsCount} views`)
    
  } catch (error) {
    console.error(`Views integration failed for prompt ${promptId}:`, error)
  }
}

/**
 * Получает статистику просмотров для дашборда
 */
export async function getViewsStatistics(): Promise<{
  totalViews: number
  topViewedPrompts: Array<{ id: string; title: string; views: number }>
  averageViews: number
  viewsDistribution: { range: string; count: number }[]
}> {
  const prompts = await prisma.prompt.findMany({
    select: { id: true, title: true, views: true }
  })
  
  const totalViews = prompts.reduce((sum, p) => sum + p.views, 0)
  const averageViews = prompts.length > 0 ? totalViews / prompts.length : 0
  
  const topViewedPrompts = prompts
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      title: p.title.substring(0, 50) + (p.title.length > 50 ? '...' : ''),
      views: p.views
    }))
  
  // Распределение просмотров по диапазонам
  const ranges = [
    { min: 0, max: 0, label: '0' },
    { min: 1, max: 5, label: '1-5' },
    { min: 6, max: 20, label: '6-20' },
    { min: 21, max: 100, label: '21-100' },
    { min: 101, max: Infinity, label: '100+' }
  ]
  
  const viewsDistribution = ranges.map(range => ({
    range: range.label,
    count: prompts.filter(p => p.views >= range.min && p.views <= range.max).length
  }))
  
  return {
    totalViews,
    topViewedPrompts,
    averageViews: Math.round(averageViews * 100) / 100,
    viewsDistribution
  }
}
