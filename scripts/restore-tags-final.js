const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function restoreTags() {
  try {
    console.log('Восстанавливаем теги...')
    
    // Получаем все промпты
    const prompts = await prisma.prompt.findMany({
      select: {
        tags: true
      }
    })
    
    console.log('Найдено промптов:', prompts.length)
    
    // Собираем все уникальные теги
    const allTags = new Set()
    
    for (const prompt of prompts) {
      if (prompt.tags && prompt.tags.trim() !== '') {
        const tags = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        tags.forEach(tag => allTags.add(tag))
      }
    }
    
    console.log('Найдено уникальных тегов:', allTags.size)
    
    // Создаем теги в базе данных
    let created = 0
    for (const tagName of allTags) {
      try {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        
        await prisma.tag.upsert({
          where: { slug: slug },
          update: {},
          create: {
            name: tagName,
            slug: slug,
            count: 0
          }
        })
        created++
        if (created % 10 === 0) {
          console.log('Создано тегов:', created)
        }
      } catch (error) {
        console.error('Ошибка при создании тега:', tagName, error.message)
      }
    }
    
    // Подсчитываем количество промптов для каждого тега
    console.log('Подсчитываем количество промптов для каждого тега...')
    const tags = await prisma.tag.findMany()
    
    for (const tag of tags) {
      const count = await prisma.prompt.count({
        where: {
          tags: {
            contains: tag.name
          }
        }
      })
      
      await prisma.tag.update({
        where: { id: tag.id },
        data: { count }
      })
      
      console.log(`Тег "${tag.name}": ${count} промптов`)
    }
    
    console.log('Теги восстановлены!')
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

restoreTags().finally(() => prisma.$disconnect())
