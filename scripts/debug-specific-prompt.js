/**
 * Отладка конкретного промпта на продакшене
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugSpecificPrompt() {
  console.log('🔍 ОТЛАДКА КОНКРЕТНОГО ПРОМПТА\n')

  const promptId = 'cmftyuu1v00539l6hapwra6su'
  const promptTitle = 'Регги с позитивным посланием'

  try {
    // 1. Получаем данные промпта
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { 
        id: true, 
        title: true, 
        views: true,
        authorId: true,
        createdAt: true
      }
    })

    if (!prompt) {
      console.log('❌ Промпт не найден в базе данных')
      return
    }

    console.log(`📋 Промпт: "${prompt.title}"`)
    console.log(`🆔 ID: ${prompt.id}`)
    console.log(`👤 Автор: ${prompt.authorId}`)
    console.log(`📅 Создан: ${prompt.createdAt}`)
    console.log()

    // 2. Проверяем все источники просмотров
    console.log('📊 ПРОВЕРЯЕМ ВСЕ ИСТОЧНИКИ ПРОСМОТРОВ:')
    
    // Прямое поле
    console.log(`  📊 prompt.views: ${prompt.views}`)
    
    // viewAnalytics
    const analytics = await prisma.viewAnalytics.findFirst({
      where: { promptId },
      select: { countedViews: true }
    })
    console.log(`  📊 viewAnalytics: ${analytics?.countedViews || 0}`)
    
    // promptViewEvent
    const viewEvents = await prisma.promptViewEvent.count({
      where: { promptId, isCounted: true }
    })
    console.log(`  📊 promptViewEvent: ${viewEvents}`)
    
    // promptInteraction
    const interactions = await prisma.promptInteraction.count({
      where: { promptId, type: { in: ['view', 'open'] } }
    })
    console.log(`  📊 promptInteraction: ${interactions}`)

    // 3. Тестируем ViewsService логику
    console.log('\n🧪 ТЕСТИРУЕМ VIEWSERVICE ЛОГИКУ:')
    
    let viewsServiceResult = 0
    let source = 'none'
    
    // ПРИОРИТЕТ 1: viewAnalytics
    if (analytics?.countedViews && analytics.countedViews > 0) {
      viewsServiceResult = analytics.countedViews
      source = 'viewAnalytics'
    }
    // ПРИОРИТЕТ 2: promptViewEvent
    else if (viewEvents > 0) {
      viewsServiceResult = viewEvents
      source = 'promptViewEvent'
    }
    // ПРИОРИТЕТ 3: promptInteraction
    else if (interactions > 0) {
      viewsServiceResult = interactions
      source = 'promptInteraction'
    }
    // ПРИОРИТЕТ 4: prompt.views
    else {
      viewsServiceResult = prompt.views
      source = 'prompt.views'
    }
    
    console.log(`  🎯 ViewsService результат: ${viewsServiceResult}`)
    console.log(`  🎯 Источник: ${source}`)

    // 4. Проверяем консистентность
    console.log('\n✅ ПРОВЕРКА КОНСИСТЕНТНОСТИ:')
    if (prompt.views === viewsServiceResult) {
      console.log(`  ✅ КОНСИСТЕНТНО: ${prompt.views} = ${viewsServiceResult}`)
    } else {
      console.log(`  ❌ НЕКОНСИСТЕНТНО: ${prompt.views} ≠ ${viewsServiceResult}`)
      console.log(`  🔧 ViewsService должен возвращать: ${viewsServiceResult}`)
      console.log(`  🔧 Прямое поле показывает: ${prompt.views}`)
    }

    // 5. Проверяем детали promptInteraction
    if (interactions > 0) {
      console.log('\n📋 ДЕТАЛИ PROMPTINTERACTION:')
      const interactionDetails = await prisma.promptInteraction.findMany({
        where: { promptId, type: { in: ['view', 'open'] } },
        select: { 
          id: true, 
          type: true, 
          createdAt: true,
          userId: true,
          ipHash: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      
      interactionDetails.forEach((interaction, i) => {
        console.log(`  ${i + 1}. ${interaction.type} - ${interaction.createdAt} (user: ${interaction.userId || 'anonymous'})`)
      })
    }

    console.log('\n✅ Отладка завершена!')

  } catch (error) {
    console.error('❌ Ошибка отладки:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSpecificPrompt().catch(console.error)
