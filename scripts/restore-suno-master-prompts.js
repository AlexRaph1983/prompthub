const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function restoreSunoMasterPrompts() {
  try {
    console.log('🔧 Восстанавливаем промпты Suno Master...')
    
    // Создаем пользователя Suno Master, если его нет
    let sunoMaster = await prisma.user.findFirst({
      where: {
        name: { contains: 'Suno Master' }
      }
    })
    
    if (!sunoMaster) {
      console.log('👤 Создаем пользователя Suno Master...')
      sunoMaster = await prisma.user.create({
        data: {
          id: 'suno-master',
          name: 'Suno Master',
          email: 'sunomaster@example.com',
          avatarUrl: null
        }
      })
      console.log(`✅ Пользователь Suno Master создан: ${sunoMaster.id}`)
    } else {
      console.log(`✅ Пользователь Suno Master найден: ${sunoMaster.id}`)
    }
    
    // Ищем промпты, которые могли принадлежать Suno Master
    const possibleSunoPrompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { title: { contains: 'Suno Master' } },
          { description: { contains: 'Suno Master' } },
          { prompt: { contains: 'Suno Master' } },
          { tags: { contains: 'Suno Master' } },
          { authorId: { in: ['promptmaster', 'user5'] } }, // Промпты от PromptMaster
          { category: 'audio' },
          { category: 'Music' }
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
      }
    })
    
    console.log(`\n🎵 Найдено ${possibleSunoPrompts.length} возможных промптов Suno Master:`)
    
    let restoredCount = 0
    
    for (const prompt of possibleSunoPrompts) {
      console.log(`\n🔍 Проверяем промпт: ${prompt.title}`)
      console.log(`   Текущий автор: ${prompt.author.name} (${prompt.author.id})`)
      console.log(`   Категория: ${prompt.category}`)
      console.log(`   Теги: ${prompt.tags}`)
      
      // Проверяем, является ли это промптом Suno Master
      const isSunoMasterPrompt = 
        prompt.title.includes('Suno Master') ||
        prompt.description.includes('Suno Master') ||
        prompt.prompt.includes('Suno Master') ||
        prompt.tags.includes('Suno Master') ||
        prompt.tags.includes('suno master') ||
        (prompt.category === 'audio' && prompt.tags.includes('suno'))
      
      if (isSunoMasterPrompt && prompt.authorId !== sunoMaster.id) {
        console.log(`   🔧 Переназначаем промпт Suno Master...`)
        
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: {
            authorId: sunoMaster.id
          }
        })
        
        console.log(`   ✅ Промпт переназначен Suno Master`)
        restoredCount++
      } else if (prompt.authorId === sunoMaster.id) {
        console.log(`   ✅ Промпт уже принадлежит Suno Master`)
      } else {
        console.log(`   ⏭️ Промпт не относится к Suno Master`)
      }
    }
    
    // Получаем финальный список промптов Suno Master
    const finalSunoPrompts = await prisma.prompt.findMany({
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
    
    console.log(`\n🎉 Восстановлено ${restoredCount} промптов!`)
    console.log(`\n📝 Промпты Suno Master (${finalSunoPrompts.length}):`)
    finalSunoPrompts.forEach((prompt, i) => {
      console.log(`\n${i + 1}. ${prompt.title}`)
      console.log(`   Категория: ${prompt.category}`)
      console.log(`   Теги: ${prompt.tags}`)
      console.log(`   Просмотры: ${prompt.views}`)
    })
    
  } catch (e) {
    console.error('❌ Ошибка при восстановлении промптов Suno Master:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

restoreSunoMasterPrompts()
