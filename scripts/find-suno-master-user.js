const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function findSunoMasterUser() {
  try {
    console.log('🔍 Ищем пользователя Suno Master...')
    
    // Ищем пользователя с именем Suno Master
    const sunoMaster = await prisma.user.findFirst({
      where: {
        name: { contains: 'Suno Master' }
      }
    })
    
    if (sunoMaster) {
      console.log(`\n✅ Найден пользователь Suno Master:`)
      console.log(`   ID: ${sunoMaster.id}`)
      console.log(`   Имя: ${sunoMaster.name}`)
      console.log(`   Email: ${sunoMaster.email}`)
      console.log(`   Создан: ${sunoMaster.createdAt}`)
      
      // Получаем промпты этого пользователя
      const prompts = await prisma.prompt.findMany({
        where: {
          authorId: sunoMaster.id
        },
        select: {
          id: true,
          title: true,
          category: true,
          tags: true,
          views: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      console.log(`\n📝 Промпты Suno Master (${prompts.length}):`)
      prompts.forEach((prompt, i) => {
        console.log(`\n${i + 1}. ${prompt.title}`)
        console.log(`   ID: ${prompt.id}`)
        console.log(`   Категория: ${prompt.category}`)
        console.log(`   Теги: ${prompt.tags}`)
        console.log(`   Просмотры: ${prompt.views}`)
        console.log(`   Создан: ${prompt.createdAt}`)
      })
      
    } else {
      console.log('\n❌ Пользователь Suno Master не найден!')
      
      // Ищем похожих пользователей
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: 'Suno' } },
            { name: { contains: 'Master' } },
            { email: { contains: 'suno' } }
          ]
        }
      })
      
      if (similarUsers.length > 0) {
        console.log('\n🔍 Похожие пользователи:')
        similarUsers.forEach((user, i) => {
          console.log(`${i + 1}. ${user.name} (${user.email}) - ${user.id}`)
        })
      }
      
      // Показываем всех пользователей
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      console.log('\n=== ВСЕ ПОЛЬЗОВАТЕЛИ ===')
      allUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email}) - ${user.createdAt}`)
      })
    }
    
  } catch (e) {
    console.error('❌ Ошибка при поиске пользователя Suno Master:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

findSunoMasterUser()
