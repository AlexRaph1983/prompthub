/**
 * Отладка ViewsService - почему getPromptViews и getPromptsViews возвращают разные значения
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Копируем логику ViewsService.getPromptViews
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

// Копируем логику ViewsService.getPromptsViews
async function getPromptsViews(promptIds) {
  const viewTotals = new Map()
  
  if (promptIds.length === 0) {
    return viewTotals
  }

  try {
    // ПРИОРИТЕТ 1: viewAnalytics для всех промптов
    const analytics = await prisma.viewAnalytics.groupBy({
      by: ['promptId'],
      where: { promptId: { in: promptIds } },
      _sum: { countedViews: true },
    })
    
    for (const row of analytics) {
      if (row._sum.countedViews && row._sum.countedViews > 0) {
        viewTotals.set(row.promptId, row._sum.countedViews)
      }
    }

    // ПРИОРИТЕТ 2: promptViewEvent для оставшихся
    const missingIds = promptIds.filter(id => !viewTotals.has(id))
    if (missingIds.length > 0) {
      const viewEvents = await prisma.promptViewEvent.groupBy({
        by: ['promptId'],
        where: { promptId: { in: missingIds }, isCounted: true },
        _count: { _all: true },
      })
      
      for (const row of viewEvents) {
        if (row._count._all && row._count._all > 0) {
          viewTotals.set(row.promptId, row._count._all)
        }
      }
    }

    // ПРИОРИТЕТ 3: promptInteraction для оставшихся
    const stillMissingIds = promptIds.filter(id => !viewTotals.has(id))
    if (stillMissingIds.length > 0) {
      const interactions = await prisma.promptInteraction.groupBy({
        by: ['promptId'],
        where: { promptId: { in: stillMissingIds }, type: { in: ['view', 'open'] } },
        _count: { _all: true },
      })
      
      for (const row of interactions) {
        if (row._count._all && row._count._all > 0) {
          viewTotals.set(row.promptId, row._count._all)
        }
      }
    }

    // ПРИОРИТЕТ 4: fallback к полю views в таблице prompt
    const finalMissingIds = promptIds.filter(id => !viewTotals.has(id))
    if (finalMissingIds.length > 0) {
      const prompts = await prisma.prompt.findMany({
        where: { id: { in: finalMissingIds } },
        select: { id: true, views: true }
      })
      
      for (const prompt of prompts) {
        if (prompt.views && prompt.views > 0) {
          viewTotals.set(prompt.id, prompt.views)
        }
      }
    }

    // Для промптов без просмотров устанавливаем 0
    for (const promptId of promptIds) {
      if (!viewTotals.has(promptId)) {
        viewTotals.set(promptId, 0)
      }
    }

    return viewTotals
  } catch (error) {
    console.error('Error getting prompts views:', error)
    // В случае ошибки возвращаем 0 для всех промптов
    for (const promptId of promptIds) {
      viewTotals.set(promptId, 0)
    }
    return viewTotals
  }
}

async function debugViewsService() {
  console.log('🔍 ОТЛАДКА VIEWSERVICE\n')

  const testPromptId = 'cmftyuu1v00539l6hapwra6su'

  try {
    // 1. Тестируем getPromptViews
    console.log('🧪 Тестируем getPromptViews...')
    const singleResult = await getPromptViews(testPromptId)
    console.log(`  📊 getPromptViews результат: ${singleResult}`)

    // 2. Тестируем getPromptsViews
    console.log('\n🧪 Тестируем getPromptsViews...')
    const multipleResult = await getPromptsViews([testPromptId])
    const multipleViews = multipleResult.get(testPromptId) || 0
    console.log(`  📊 getPromptsViews результат: ${multipleViews}`)

    // 3. Проверяем консистентность
    console.log('\n✅ ПРОВЕРКА КОНСИСТЕНТНОСТИ:')
    if (singleResult === multipleViews) {
      console.log(`  ✅ КОНСИСТЕНТНО: ${singleResult} = ${multipleViews}`)
    } else {
      console.log(`  ❌ НЕКОНСИСТЕНТНО: ${singleResult} ≠ ${multipleViews}`)
      console.log(`  🔧 ПРОБЛЕМА: ViewsService работает по-разному для одного и множества промптов!`)
    }

    // 4. Детальная отладка источников
    console.log('\n🔍 ДЕТАЛЬНАЯ ОТЛАДКА ИСТОЧНИКОВ:')
    
    // viewAnalytics
    const analytics = await prisma.viewAnalytics.findFirst({
      where: { promptId: testPromptId },
      select: { countedViews: true }
    })
    console.log(`  📊 viewAnalytics: ${analytics?.countedViews || 0}`)
    
    // promptViewEvent
    const viewEvents = await prisma.promptViewEvent.count({
      where: { promptId: testPromptId, isCounted: true }
    })
    console.log(`  📊 promptViewEvent: ${viewEvents}`)
    
    // promptInteraction
    const interactions = await prisma.promptInteraction.count({
      where: { promptId: testPromptId, type: { in: ['view', 'open'] } }
    })
    console.log(`  📊 promptInteraction: ${interactions}`)
    
    // prompt.views
    const prompt = await prisma.prompt.findUnique({
      where: { id: testPromptId },
      select: { views: true }
    })
    console.log(`  📊 prompt.views: ${prompt?.views || 0}`)

    // 5. Проверяем groupBy запросы
    console.log('\n🔍 ПРОВЕРЯЕМ GROUPBY ЗАПРОСЫ:')
    
    // viewAnalytics groupBy
    const analyticsGroupBy = await prisma.viewAnalytics.groupBy({
      by: ['promptId'],
      where: { promptId: testPromptId },
      _sum: { countedViews: true },
    })
    console.log(`  📊 viewAnalytics groupBy: ${analyticsGroupBy.length} записей`)
    if (analyticsGroupBy.length > 0) {
      console.log(`  📊 viewAnalytics groupBy результат: ${analyticsGroupBy[0]._sum.countedViews || 0}`)
    }
    
    // promptViewEvent groupBy
    const viewEventsGroupBy = await prisma.promptViewEvent.groupBy({
      by: ['promptId'],
      where: { promptId: testPromptId, isCounted: true },
      _count: { _all: true },
    })
    console.log(`  📊 promptViewEvent groupBy: ${viewEventsGroupBy.length} записей`)
    if (viewEventsGroupBy.length > 0) {
      console.log(`  📊 promptViewEvent groupBy результат: ${viewEventsGroupBy[0]._count._all || 0}`)
    }
    
    // promptInteraction groupBy
    const interactionsGroupBy = await prisma.promptInteraction.groupBy({
      by: ['promptId'],
      where: { promptId: testPromptId, type: { in: ['view', 'open'] } },
      _count: { _all: true },
    })
    console.log(`  📊 promptInteraction groupBy: ${interactionsGroupBy.length} записей`)
    if (interactionsGroupBy.length > 0) {
      console.log(`  📊 promptInteraction groupBy результат: ${interactionsGroupBy[0]._count._all || 0}`)
    }

    console.log('\n✅ Отладка ViewsService завершена!')

  } catch (error) {
    console.error('❌ Ошибка отладки:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugViewsService().catch(console.error)
