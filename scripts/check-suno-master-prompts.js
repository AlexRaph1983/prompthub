const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function checkSunoMasterPrompts() {
  try {
    console.log('🔍 Проверяем промпты Suno Master...')
    
    // Ищем пользователя Suno Master
    const sunoMaster = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Suno Master' } },
          { name: { contains: 'SunoMaster' } },
          { email: { contains: 'suno' } }
        ]
      }
    })
    
    if (sunoMaster) {
      console.log(`\n✅ Найден пользователь Suno Master:`)
      console.log(`   ID: ${sunoMaster.id}`)
      console.log(`   Имя: ${sunoMaster.name}`)
      console.log(`   Email: ${sunoMaster.email}`)
      
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
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      console.log(`\n📝 Промпты Suno Master (${prompts.length}):`)
      prompts.forEach((prompt, i) => {
        console.log(`\n${i + 1}. ${prompt.title}`)
        console.log(`   Категория: ${prompt.category}`)
        console.log(`   Теги: ${prompt.tags}`)
        console.log(`   Создан: ${prompt.createdAt}`)
      })
      
    } else {
      console.log('\n❌ Пользователь Suno Master не найден!')
      
      // Показываем всех пользователей
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true
        }
      })
      
      console.log('\n=== ВСЕ ПОЛЬЗОВАТЕЛИ ===')
      allUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email})`)
      })
    }
    
    // Проверяем, есть ли промпты с упоминанием Suno
    const sunoPrompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { title: { contains: 'Suno' } },
          { description: { contains: 'Suno' } },
          { prompt: { contains: 'Suno' } },
          { tags: { contains: 'Suno' } }
        ]
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`\n🎵 Промпты с упоминанием Suno (${sunoPrompts.length}):`)
    sunoPrompts.forEach((prompt, i) => {
      console.log(`${i + 1}. ${prompt.title} (автор: ${prompt.author.name || prompt.author.email})`)
    })
    
  } catch (e) {
    console.error('❌ Ошибка при проверке промптов Suno Master:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSunoMasterPrompts()
