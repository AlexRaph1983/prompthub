/**
 * Скрипт для восстановления потерянных просмотров промптов
 * Восстанавливает данные из viewAnalytics, promptViewEvent и promptInteraction
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ViewsRestoreResult {
  promptId: string
  title: string
  oldViews: number
  newViews: number
  source: 'viewAnalytics' | 'promptViewEvent' | 'promptInteraction' | 'unchanged'
}

async function getViewsFromAnalytics(promptId: string): Promise<number> {
  const result = await prisma.viewAnalytics.aggregate({
    where: { promptId },
    _sum: { countedViews: true },
  })
  return result._sum.countedViews || 0
}

async function getViewsFromEvents(promptId: string): Promise<number> {
  const result = await prisma.promptViewEvent.count({
    where: { 
      promptId,
      isCounted: true
    },
  })
  return result
}

async function getViewsFromInteractions(promptId: string): Promise<number> {
  const result = await prisma.promptInteraction.count({
    where: { 
      promptId,
      type: { in: ['view', 'open'] }
    },
  })
  return result
}

async function restoreViewsForPrompt(prompt: { id: string, title: string, views: number }): Promise<ViewsRestoreResult> {
  const { id: promptId, title, views: currentViews } = prompt
  
  // Если просмотры уже есть и больше 0, не трогаем
  if (currentViews > 0) {
    return {
      promptId,
      title,
      oldViews: currentViews,
      newViews: currentViews,
      source: 'unchanged'
    }
  }
  
  // Пытаемся восстановить из разных источников
  let restoredViews = 0
  let source: 'viewAnalytics' | 'promptViewEvent' | 'promptInteraction' | 'unchanged' = 'unchanged'
  
  // 1. Пробуем viewAnalytics
  const analyticsViews = await getViewsFromAnalytics(promptId)
  if (analyticsViews > 0) {
    restoredViews = analyticsViews
    source = 'viewAnalytics'
  }
  
  // 2. Если нет в аналитике, пробуем события
  if (restoredViews === 0) {
    const eventViews = await getViewsFromEvents(promptId)
    if (eventViews > 0) {
      restoredViews = eventViews
      source = 'promptViewEvent'
    }
  }
  
  // 3. Если и событий нет, пробуем взаимодействия
  if (restoredViews === 0) {
    const interactionViews = await getViewsFromInteractions(promptId)
    if (interactionViews > 0) {
      restoredViews = interactionViews
      source = 'promptInteraction'
    }
  }
  
  // Если нашли просмотры, обновляем в БД
  if (restoredViews > 0) {
    await prisma.prompt.update({
      where: { id: promptId },
      data: { views: restoredViews }
    })
  }
  
  return {
    promptId,
    title,
    oldViews: currentViews,
    newViews: restoredViews,
    source
  }
}

async function main() {
  console.log('🔄 Начинаем восстановление просмотров промптов...\n')
  
  // Получаем все промпты
  const prompts = await prisma.prompt.findMany({
    select: { id: true, title: true, views: true },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(`📊 Найдено промптов: ${prompts.length}`)
  
  const results: ViewsRestoreResult[] = []
  let restored = 0
  let unchanged = 0
  
  // Восстанавливаем просмотры для каждого промпта
  for (const [index, prompt] of prompts.entries()) {
    const result = await restoreViewsForPrompt(prompt)
    results.push(result)
    
    if (result.source !== 'unchanged') {
      restored++
      console.log(`✅ ${index + 1}/${prompts.length}: "${result.title.substring(0, 50)}..." ${result.oldViews} → ${result.newViews} (${result.source})`)
    } else {
      unchanged++
      if (result.oldViews > 0) {
        console.log(`⚪ ${index + 1}/${prompts.length}: "${result.title.substring(0, 50)}..." уже имеет ${result.oldViews} просмотров`)
      }
    }
  }
  
  console.log('\n📈 РЕЗУЛЬТАТЫ ВОССТАНОВЛЕНИЯ:')
  console.log(`✅ Восстановлено: ${restored} промптов`)
  console.log(`⚪ Без изменений: ${unchanged} промптов`)
  
  // Показываем детальную статистику
  const bySource = results.reduce((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\n📊 ИСТОЧНИКИ ВОССТАНОВЛЕНИЯ:')
  Object.entries(bySource).forEach(([source, count]) => {
    const emoji = source === 'unchanged' ? '⚪' : 
                  source === 'viewAnalytics' ? '📈' :
                  source === 'promptViewEvent' ? '📋' : '🔗'
    console.log(`${emoji} ${source}: ${count}`)
  })
  
  // Показываем топ восстановленных
  const topRestored = results
    .filter(r => r.source !== 'unchanged')
    .sort((a, b) => b.newViews - a.newViews)
    .slice(0, 10)
  
  if (topRestored.length > 0) {
    console.log('\n🏆 ТОП ВОССТАНОВЛЕННЫХ ПРОМПТОВ:')
    topRestored.forEach((r, i) => {
      console.log(`${i + 1}. "${r.title}" - ${r.newViews} просмотров (${r.source})`)
    })
  }
  
  console.log('\n🎉 Восстановление завершено!')
}

main()
  .catch((error) => {
    console.error('❌ Ошибка восстановления:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
