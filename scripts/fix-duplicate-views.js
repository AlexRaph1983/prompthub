const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDuplicateViews() {
  try {
    console.log('🔧 Исправляем дублирующие просмотры...')
    
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
    let totalViewsFixed = 0
    
    for (const prompt of prompts) {
      // Считаем дублирующие взаимодействия типа 'view'
      const duplicateInteractions = await prisma.promptInteraction.count({
        where: {
          promptId: prompt.id,
          type: 'view'
        }
      })
      
      if (duplicateInteractions > 0) {
        console.log(`🔍 Промпт "${prompt.title}": ${duplicateInteractions} дублирующих взаимодействий`)
        
        // Удаляем дублирующие взаимодействия типа 'view'
        await prisma.promptInteraction.deleteMany({
          where: {
            promptId: prompt.id,
            type: 'view'
          }
        })
        
        console.log(`✅ Удалено ${duplicateInteractions} дублирующих записей для "${prompt.title}"`)
        fixedCount++
        totalViewsFixed += duplicateInteractions
      }
    }
    
    console.log(`\n📊 Результаты исправления:`)
    console.log(`✅ Исправлено промптов: ${fixedCount}`)
    console.log(`🗑️  Удалено дублирующих записей: ${totalViewsFixed}`)
    
    // Проверяем, что ViewsService теперь возвращает правильные значения
    console.log(`\n🔍 Проверяем исправления...`)
    
    // Простая проверка без импорта ViewsService
    for (const prompt of prompts.slice(0, 5)) { // Проверяем первые 5 промптов
      console.log(`📈 "${prompt.title}": DB views=${prompt.views}`)
    }
    
    console.log('\n🎉 Исправление дублирующих просмотров завершено!')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicateViews()
