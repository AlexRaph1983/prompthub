/**
 * Прямой тест консистентности просмотров через ViewsService
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Импортируем ViewsService
const { ViewsService } = require('../lib/services/viewsService')

async function testViewsDirect() {
  console.log('🧪 ПРЯМОЙ ТЕСТ КОНСИСТЕНТНОСТИ ПРОСМОТРОВ\n')

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
      const viewsServiceSingle = await ViewsService.getPromptViews(prompt.id)
      
      console.log(`  📊 Прямое поле: ${directField}`)
      console.log(`  📊 ViewsService (single): ${viewsServiceSingle}`)

      // Проверяем консистентность
      if (directField === viewsServiceSingle) {
        console.log(`  ✅ КОНСИСТЕНТНО: значения совпадают`)
      } else {
        console.log(`  ❌ НЕКОНСИСТЕНТНО: ${directField} ≠ ${viewsServiceSingle}`)
      }
      
      console.log()
    }

    // 3. Тестируем ViewsService для множества промптов
    console.log('📊 Тестируем ViewsService для множества промптов...')
    const promptIds = testPrompts.map(p => p.id)
    const viewsServiceMultiple = await ViewsService.getPromptsViews(promptIds)
    
    console.log('Результаты ViewsService.getPromptsViews():')
    for (const [promptId, views] of viewsServiceMultiple) {
      const prompt = testPrompts.find(p => p.id === promptId)
      console.log(`  ${prompt?.title.substring(0, 30)}...: ${views}`)
    }

    // 4. Проверяем, есть ли данные в viewAnalytics
    console.log('\n📊 Проверяем viewAnalytics...')
    const analytics = await prisma.viewAnalytics.findMany({
      take: 5,
      select: { promptId: true, countedViews: true }
    })
    
    if (analytics.length > 0) {
      console.log('Найдены записи в viewAnalytics:')
      analytics.forEach(a => {
        const prompt = testPrompts.find(p => p.id === a.promptId)
        console.log(`  ${prompt?.title.substring(0, 30)}...: ${a.countedViews}`)
      })
    } else {
      console.log('❌ Нет записей в viewAnalytics')
    }

    // 5. Проверяем promptViewEvent
    console.log('\n📊 Проверяем promptViewEvent...')
    const viewEvents = await prisma.promptViewEvent.findMany({
      take: 5,
      where: { isCounted: true },
      select: { promptId: true }
    })
    
    if (viewEvents.length > 0) {
      console.log(`Найдено ${viewEvents.length} событий просмотров`)
    } else {
      console.log('❌ Нет событий просмотров')
    }

    // 6. Проверяем promptInteraction
    console.log('\n📊 Проверяем promptInteraction...')
    const interactions = await prisma.promptInteraction.findMany({
      take: 5,
      where: { type: { in: ['view', 'open'] } },
      select: { promptId: true }
    })
    
    if (interactions.length > 0) {
      console.log(`Найдено ${interactions.length} взаимодействий`)
    } else {
      console.log('❌ Нет взаимодействий')
    }

    console.log('\n✅ Прямой тест завершен!')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testViewsDirect().catch(console.error)
