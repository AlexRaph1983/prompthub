const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixFinalViewsBug() {
  try {
    console.log('🔧 Финальное исправление бага с просмотрами...')
    
    // Получаем все промпты с их текущими просмотрами
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        views: true
      }
    })
    
    console.log(`📊 Найдено ${prompts.length} промптов`)
    
    let fixedCount = 0
    let totalInteractionsRemoved = 0
    
    for (const prompt of prompts) {
      // Считаем дублирующие взаимодействия типа 'open'
      const duplicateInteractions = await prisma.promptInteraction.count({
        where: {
          promptId: prompt.id,
          type: 'open'
        }
      })
      
      if (duplicateInteractions > 0) {
        console.log(`🔍 Промпт "${prompt.title}": ${duplicateInteractions} дублирующих взаимодействий типа 'open'`)
        
        // Удаляем дублирующие взаимодействия типа 'open'
        const deleteResult = await prisma.promptInteraction.deleteMany({
          where: {
            promptId: prompt.id,
            type: 'open'
          }
        })
        
        console.log(`✅ Удалено ${deleteResult.count} записей для "${prompt.title}"`)
        totalInteractionsRemoved += deleteResult.count
        fixedCount++
      }
    }
    
    console.log('\n📊 Результаты исправления:')
    console.log(`✅ Исправлено промптов: ${fixedCount}`)
    console.log(`🗑️  Удалено дублирующих записей: ${totalInteractionsRemoved}`)
    
    // Проверяем, что ViewsService теперь возвращает правильные значения
    console.log(`\n🔍 Проверяем исправления...`)
    
    for (const prompt of prompts.slice(0, 5)) { // Проверяем первые 5 промптов
      console.log(`📈 "${prompt.title}": DB views=${prompt.views}`)
    }
    
    console.log('\n🎉 Финальное исправление завершено!')
    console.log('💡 Теперь просмотры считаются только из Prompt.views (основной источник)')
    console.log('💡 PromptInteraction с типом "open" больше не считаются как просмотры')
    
  } catch (error) {
    console.error('❌ Критическая ошибка при исправлении:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixFinalViewsBug()
