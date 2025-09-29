/**
 * Финальный тест консистентности просмотров
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

async function testFinalViews() {
  console.log('🧪 ФИНАЛЬНЫЙ ТЕСТ КОНСИСТЕНТНОСТИ ПРОСМОТРОВ\n')

  try {
    // 1. Получаем несколько промптов для тестирования
    const testPrompts = await prisma.prompt.findMany({
      take: 10,
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
    let consistentCount = 0
    let inconsistentCount = 0
    
    for (const prompt of testPrompts) {
      const directField = prompt.views
      const viewsServiceResult = await getPromptViews(prompt.id)
      
      if (directField === viewsServiceResult) {
        consistentCount++
        console.log(`✅ "${prompt.title.substring(0, 30)}...": КОНСИСТЕНТНО (${viewsServiceResult})`)
      } else {
        inconsistentCount++
        console.log(`❌ "${prompt.title.substring(0, 30)}...": НЕКОНСИСТЕНТНО (${directField} ≠ ${viewsServiceResult})`)
      }
    }

    console.log(`\n📊 РЕЗУЛЬТАТЫ:`)
    console.log(`  ✅ Консистентных: ${consistentCount}`)
    console.log(`  ❌ Неконсистентных: ${inconsistentCount}`)
    console.log(`  📈 Процент консистентности: ${Math.round((consistentCount / testPrompts.length) * 100)}%`)

    // 3. Тестируем общую статистику
    console.log('\n📊 Тестируем общую статистику...')
    
    const totalViewsDirect = await prisma.prompt.aggregate({
      _sum: { views: true }
    })
    
    // Подсчитываем через ViewsService
    const promptIds = testPrompts.map(p => p.id)
    const viewTotals = new Map()
    for (const promptId of promptIds) {
      const views = await getPromptViews(promptId)
      viewTotals.set(promptId, views)
    }
    const totalViewsService = Array.from(viewTotals.values()).reduce((sum, views) => sum + views, 0)
    
    console.log(`  📊 Общие просмотры (прямое поле): ${totalViewsDirect._sum.views || 0}`)
    console.log(`  📊 Общие просмотры (ViewsService): ${totalViewsService}`)

    if (totalViewsDirect._sum.views === totalViewsService) {
      console.log(`  ✅ ОБЩАЯ СТАТИСТИКА КОНСИСТЕНТНА`)
    } else {
      console.log(`  ❌ ОБЩАЯ СТАТИСТИКА НЕКОНСИСТЕНТНА`)
    }

    // 4. Рекомендации
    console.log('\n🔧 РЕКОМЕНДАЦИИ:')
    if (inconsistentCount === 0) {
      console.log('  ✅ Все промпты консистентны! Проблема решена.')
    } else {
      console.log('  🔧 Нужно обновить поле prompt.views для неконсистентных промптов')
      console.log('  🔧 ViewsService должен использоваться везде вместо прямого поля')
    }

    console.log('\n✅ Финальный тест завершен!')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFinalViews().catch(console.error)
