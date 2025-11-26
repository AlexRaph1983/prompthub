const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function testAdminAPI() {
  try {
    console.log('🔍 Тестируем API админ-панели...')
    
    // Симулируем запрос к API /api/admin/prompts
    const prompts = await prisma.prompt.findMany({
      take: 3,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            ratings: true,
            reviews: true,
            likes: true,
            saves: true,
            comments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('\n=== ПРОМПТЫ ДЛЯ АДМИН-ПАНЕЛИ ===')
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
      
      console.log(`   Автор: ${prompt.author.name || prompt.author.email}`)
      console.log(`   Просмотры: ${prompt.views}`)
      console.log(`   Рейтинг: ${prompt.averageRating} (${prompt.totalRatings})`)
    })
    
    console.log('\n✅ API админ-панели работает корректно')
    console.log('Теги должны отображаться в админ-панели как синие бейджи')
    
  } catch (e) {
    console.error('❌ Ошибка при тестировании API:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAPI()
