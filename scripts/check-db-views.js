/**
 * Проверка просмотров в базе данных
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkViews() {
  try {
    console.log('🔍 Проверяем views в базе данных...\n')
    
    // Проверяем последние промпты
    const prompts = await prisma.prompt.findMany({
      select: { id: true, title: true, views: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log('📊 ПОСЛЕДНИЕ ПРОМПТЫ:')
    prompts.forEach((p, i) => {
      console.log(`${i + 1}. "${p.title.substring(0, 50)}..." - ${p.views} просмотров (${p.id})`)
    })
    
    // Проверяем конкретный промпт из теста
    const testPromptId = prompts[0]?.id
    if (testPromptId) {
      console.log(`\n🔍 ДЕТАЛИ ПРОМПТА ${testPromptId}:`)
      
      // Проверяем основное поле
      const prompt = await prisma.prompt.findUnique({
        where: { id: testPromptId },
        select: { id: true, title: true, views: true }
      })
      console.log(`📊 Prompt.views: ${prompt?.views}`)
      
      // Проверяем viewAnalytics
      const analytics = await prisma.viewAnalytics.findMany({
        where: { promptId: testPromptId },
        select: { countedViews: true, date: true }
      })
      console.log(`📈 ViewAnalytics записей: ${analytics.length}`)
      analytics.forEach(a => console.log(`   - ${a.date}: ${a.countedViews} просмотров`))
      
      // Проверяем promptViewEvent
      const events = await prisma.promptViewEvent.findMany({
        where: { promptId: testPromptId },
        select: { isCounted: true, createdAt: true }
      })
      console.log(`📋 PromptViewEvent записей: ${events.length}`)
      events.forEach(e => console.log(`   - ${e.createdAt.toISOString()}: counted=${e.isCounted}`))
      
      // Проверяем promptInteraction
      const interactions = await prisma.promptInteraction.findMany({
        where: { promptId: testPromptId, type: { in: ['view', 'open'] } },
        select: { type: true, createdAt: true }
      })
      console.log(`🔗 PromptInteraction записей: ${interactions.length}`)
      interactions.forEach(i => console.log(`   - ${i.createdAt.toISOString()}: ${i.type}`))
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkViews()
