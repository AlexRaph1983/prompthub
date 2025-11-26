const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function checkTagsInDB() {
  try {
    console.log('🔍 Проверяем теги в базе данных...')
    
    // Получаем несколько промптов с тегами
    const prompts = await prisma.prompt.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        tags: true,
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('\n=== ПРОМПТЫ С ТЕГАМИ ===')
    prompts.forEach((prompt, i) => {
      console.log(`\n${i + 1}. ${prompt.title}`)
      console.log(`   Категория: ${prompt.category}`)
      console.log(`   Теги: "${prompt.tags}"`)
      
      if (prompt.tags) {
        const tagsArray = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        console.log(`   Теги (массив): [${tagsArray.join(', ')}]`)
        console.log(`   Количество тегов: ${tagsArray.length}`)
      } else {
        console.log(`   ❌ Теги отсутствуют`)
      }
    })
    
    // Проверяем общую статистику
    const totalPrompts = await prisma.prompt.count()
    const promptsWithTags = await prisma.prompt.count({
      where: {
        tags: {
          not: ''
        }
      }
    })
    
    console.log(`\n=== СТАТИСТИКА ===`)
    console.log(`Всего промптов: ${totalPrompts}`)
    console.log(`Промптов с тегами: ${promptsWithTags}`)
    console.log(`Промптов без тегов: ${totalPrompts - promptsWithTags}`)
    
    if (promptsWithTags === 0) {
      console.log('\n❌ ПРОБЛЕМА: В базе данных нет промптов с тегами!')
      console.log('✅ РЕШЕНИЕ: Нужно добавить теги к существующим промптам')
    } else {
      console.log('\n✅ Теги есть в базе данных')
    }
    
  } catch (e) {
    console.error('❌ Ошибка при проверке тегов:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTagsInDB()
