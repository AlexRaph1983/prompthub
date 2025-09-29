/**
 * Простой тест консистентности просмотров
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testViewsSimple() {
  console.log('🧪 ПРОСТОЙ ТЕСТ КОНСИСТЕНТНОСТИ ПРОСМОТРОВ\n')

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

    // 2. Проверяем каждый промпт
    for (const prompt of testPrompts) {
      console.log(`🔍 Тестируем промпт: "${prompt.title.substring(0, 40)}..."`)
      
      const directField = prompt.views
      
      // Проверяем viewAnalytics
      const analytics = await prisma.viewAnalytics.findFirst({
        where: { promptId: prompt.id },
        select: { countedViews: true }
      })
      
      // Проверяем promptViewEvent
      const viewEvents = await prisma.promptViewEvent.count({
        where: { promptId: prompt.id, isCounted: true }
      })
      
      // Проверяем promptInteraction
      const interactions = await prisma.promptInteraction.count({
        where: { promptId: prompt.id, type: { in: ['view', 'open'] } }
      })
      
      console.log(`  📊 Прямое поле: ${directField}`)
      console.log(`  📊 viewAnalytics: ${analytics?.countedViews || 0}`)
      console.log(`  📊 promptViewEvent: ${viewEvents}`)
      console.log(`  📊 promptInteraction: ${interactions}`)
      
      // Определяем приоритетный источник
      let prioritySource = 'prompt.views'
      let priorityValue = directField
      
      if (analytics?.countedViews && analytics.countedViews > 0) {
        prioritySource = 'viewAnalytics'
        priorityValue = analytics.countedViews
      } else if (viewEvents > 0) {
        prioritySource = 'promptViewEvent'
        priorityValue = viewEvents
      } else if (interactions > 0) {
        prioritySource = 'promptInteraction'
        priorityValue = interactions
      }
      
      console.log(`  🎯 Приоритетный источник: ${prioritySource} = ${priorityValue}`)
      
      // Проверяем консистентность
      if (directField === priorityValue) {
        console.log(`  ✅ КОНСИСТЕНТНО: все источники дают одинаковый результат`)
      } else {
        console.log(`  ❌ НЕКОНСИСТЕНТНО: ${directField} ≠ ${priorityValue}`)
        console.log(`  🔧 РЕКОМЕНДАЦИЯ: обновить prompt.views до ${priorityValue}`)
      }
      
      console.log()
    }

    // 3. Проверяем общую статистику
    console.log('📊 Проверяем общую статистику...')
    
    const totalViewsDirect = await prisma.prompt.aggregate({
      _sum: { views: true }
    })
    
    console.log(`  📊 Общие просмотры (прямое поле): ${totalViewsDirect._sum.views || 0}`)
    
    // Проверяем viewAnalytics
    const totalAnalytics = await prisma.viewAnalytics.aggregate({
      _sum: { countedViews: true }
    })
    console.log(`  📊 Общие просмотры (viewAnalytics): ${totalAnalytics._sum.countedViews || 0}`)
    
    // Проверяем promptViewEvent
    const totalEvents = await prisma.promptViewEvent.count({
      where: { isCounted: true }
    })
    console.log(`  📊 Общие просмотры (promptViewEvent): ${totalEvents}`)
    
    // Проверяем promptInteraction
    const totalInteractions = await prisma.promptInteraction.count({
      where: { type: { in: ['view', 'open'] } }
    })
    console.log(`  📊 Общие просмотры (promptInteraction): ${totalInteractions}`)

    console.log('\n✅ Простой тест завершен!')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testViewsSimple().catch(console.error)
