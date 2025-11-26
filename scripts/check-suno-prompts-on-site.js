const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function checkSunoPromptsOnSite() {
  try {
    console.log('🔍 Проверяем промпты Suno на сайте...')
    
    // Получаем все промпты с упоминанием Suno
    const sunoPrompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { title: { contains: 'Suno' } },
          { description: { contains: 'Suno' } },
          { prompt: { contains: 'Suno' } },
          { tags: { contains: 'Suno' } }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n🎵 Найдено ${sunoPrompts.length} промптов с упоминанием Suno:`)
    
    sunoPrompts.forEach((prompt, i) => {
      console.log(`\n${i + 1}. ${prompt.title}`)
      console.log(`   ID: ${prompt.id}`)
      console.log(`   Автор: ${prompt.author.name || prompt.author.email} (${prompt.author.id})`)
      console.log(`   Категория: ${prompt.category}`)
      console.log(`   Теги: ${prompt.tags}`)
      console.log(`   Просмотры: ${prompt.views}`)
      console.log(`   Рейтинг: ${prompt.averageRating} (${prompt.totalRatings})`)
      console.log(`   Создан: ${prompt.createdAt}`)
      console.log(`   Описание: ${prompt.description}`)
    })
    
    // Проверяем, есть ли проблемы с отображением
    const hiddenPrompts = sunoPrompts.filter(p => p.views === 0)
    const visiblePrompts = sunoPrompts.filter(p => p.views > 0)
    
    console.log(`\n📊 Статистика:`)
    console.log(`   Видимых промптов: ${visiblePrompts.length}`)
    console.log(`   Скрытых промптов: ${hiddenPrompts.length}`)
    
    if (hiddenPrompts.length > 0) {
      console.log(`\n❌ Скрытые промпты:`)
      hiddenPrompts.forEach((prompt, i) => {
        console.log(`   ${i + 1}. ${prompt.title} (${prompt.author.name})`)
      })
    }
    
    // Проверяем, есть ли промпты с пустым содержимым
    const emptyPrompts = sunoPrompts.filter(p => !p.prompt || p.prompt.trim() === '')
    if (emptyPrompts.length > 0) {
      console.log(`\n⚠️ Промпты с пустым содержимым:`)
      emptyPrompts.forEach((prompt, i) => {
        console.log(`   ${i + 1}. ${prompt.title} (${prompt.author.name})`)
      })
    }
    
  } catch (e) {
    console.error('❌ Ошибка при проверке промптов Suno:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSunoPromptsOnSite()
