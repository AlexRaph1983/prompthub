/**
 * Тест ViewsService
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Копируем логику ViewsService
async function getPromptViews(promptId) {
  try {
    // ПРИОРИТЕТ 1: viewAnalytics (самый точный источник)
    const analytics = await prisma.viewAnalytics.findFirst({
      where: { promptId },
      select: { countedViews: true }
    })
    
    if (analytics?.countedViews && analytics.countedViews > 0) {
      return analytics.countedViews
    }

    // ПРИОРИТЕТ 2: promptViewEvent (события просмотров)
    const viewEvents = await prisma.promptViewEvent.count({
      where: { promptId, isCounted: true }
    })
    
    if (viewEvents > 0) {
      return viewEvents
    }

    // ПРИОРИТЕТ 3: promptInteraction (взаимодействия типа view/open)
    const interactions = await prisma.promptInteraction.count({
      where: { promptId, type: { in: ['view', 'open'] } }
    })
    
    if (interactions > 0) {
      return interactions
    }

    // ПРИОРИТЕТ 4: fallback к полю views в таблице prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { views: true }
    })
    
    return prompt?.views || 0
  } catch (error) {
    console.error('Error getting prompt views:', error)
    return 0
  }
}

async function testViewsService() {
  console.log('🧪 ТЕСТ VIEWSERVICE\n')

  try {
    // 1. Получаем несколько промптов для тестирования
    const testPrompts = await prisma.prompt.findMany({
      take: 5,
      select: { id: true, title: true, views: true }
    })

    if (testPrompts.length === 0) {
      console.log('❌ Нет промптов для тестирования')
      return
    }

    console.log(`📋 Тестируем ${testPrompts.length} промптов:`)
    testPrompts.forEach((p, i) => {
      console.log(`${i + 1}. "${p.title.substring(0, 40)}..." (ID: ${p.id})`)
    })
    console.log()

    // 2. Тестируем ViewsService для каждого промпта
    for (const prompt of testPrompts) {
      console.log(`🔍 Тестируем промпт: "${prompt.title.substring(0, 40)}..."`)
      
      const directField = prompt.views
      const viewsServiceResult = await getPromptViews(prompt.id)
      
      console.log(`  📊 Прямое поле: ${directField}`)
      console.log(`  📊 ViewsService: ${viewsServiceResult}`)

      // Проверяем консистентность
      if (directField === viewsServiceResult) {
        console.log(`  ✅ КОНСИСТЕНТНО: значения совпадают`)
      } else {
        console.log(`  ❌ НЕКОНСИСТЕНТНО: ${directField} ≠ ${viewsServiceResult}`)
        console.log(`  🔧 ViewsService должен возвращать: ${viewsServiceResult}`)
      }
      
      console.log()
    }

    // 3. Тестируем ViewsService для множества промптов
    console.log('📊 Тестируем ViewsService для множества промптов...')
    const promptIds = testPrompts.map(p => p.id)
    
    const viewTotals = new Map()
    for (const promptId of promptIds) {
      const views = await getPromptViews(promptId)
      viewTotals.set(promptId, views)
    }
    
    console.log('Результаты ViewsService:')
    for (const [promptId, views] of viewTotals) {
      const prompt = testPrompts.find(p => p.id === promptId)
      console.log(`  ${prompt?.title.substring(0, 30)}...: ${views}`)
    }

    console.log('\n✅ Тест ViewsService завершен!')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testViewsService().catch(console.error)
