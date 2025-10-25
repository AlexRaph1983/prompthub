const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

async function restoreAllPrompts() {
  try {
    console.log('Восстанавливаем все промпты пользователей...')
    
    // Создаем пользователей если их нет
    const users = [
      { id: 'user1', name: 'User1', email: 'user1@example.com' },
      { id: 'user2', name: 'User2', email: 'user2@example.com' },
      { id: 'user3', name: 'User3', email: 'user3@example.com' },
      { id: 'user4', name: 'User4', email: 'user4@example.com' },
      { id: 'user5', name: 'User5', email: 'user5@example.com' }
    ]
    
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      })
    }
    
    console.log('Пользователи созданы')
    
    // Получаем категории
    const categories = await prisma.category.findMany()
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id
    })
    
    console.log('Найдено категорий:', categories.length)
    
    // Функция для импорта промптов из файла
    async function importPromptsFromFile(filename, userId) {
      try {
        const data = fs.readFileSync(filename, 'utf8')
        const jsonData = JSON.parse(data)
        
        let prompts = []
        if (jsonData.items && Array.isArray(jsonData.items)) {
          prompts = jsonData.items
        } else if (Array.isArray(jsonData)) {
          prompts = jsonData
        }
        
        console.log(`Импортируем ${prompts.length} промптов из ${filename}`)
        
        let imported = 0
        for (const promptData of prompts) {
          try {
            // Генерируем уникальный ID
            const promptId = `user-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            
            // Определяем категорию
            let categoryId = categoryMap['writing'] // по умолчанию
            if (promptData.category) {
              const category = promptData.category.toLowerCase()
              if (category.includes('video') || category.includes('аудио')) {
                categoryId = categoryMap['video'] || categoryMap['audio']
              } else if (category.includes('audio') || category.includes('музыка')) {
                categoryId = categoryMap['audio']
              } else if (category.includes('design') || category.includes('дизайн')) {
                categoryId = categoryMap['design']
              } else if (category.includes('image') || category.includes('изображение')) {
                categoryId = categoryMap['image']
              } else if (category.includes('productivity') || category.includes('продуктивность')) {
                categoryId = categoryMap['productivity']
              }
            }
            
            await prisma.prompt.create({
              data: {
                id: promptId,
                title: promptData.title,
                description: promptData.description || '',
                prompt: promptData.prompt || '',
                model: promptData.model || 'GPT-4',
                lang: promptData.lang || 'ru',
                category: promptData.category || 'Writing',
                tags: Array.isArray(promptData.tags) ? promptData.tags.join(',') : promptData.tags || '',
                license: promptData.license || 'MIT',
                authorId: userId,
                categoryId: categoryId
              }
            })
            
            imported++
            if (imported % 5 === 0) {
              console.log(`Импортировано: ${imported}`)
            }
          } catch (error) {
            console.error(`Ошибка при импорте промпта:`, error.message)
          }
        }
        
        console.log(`Импортировано ${imported} промптов из ${filename}`)
        return imported
      } catch (error) {
        console.error(`Ошибка при чтении ${filename}:`, error.message)
        return 0
      }
    }
    
    // Импортируем промпты из всех файлов
    const files = [
      { file: 'prompts_prompthub2.json', user: 'user1' },
      { file: 'prompts_prompthub3.json', user: 'user2' },
      { file: 'prompts_prompthub4.json', user: 'user3' },
      { file: 'suno_prompts.json', user: 'user4' },
      { file: 'new_prompts_batch.json', user: 'user5' }
    ]
    
    let totalImported = 0
    for (const fileInfo of files) {
      const imported = await importPromptsFromFile(fileInfo.file, fileInfo.user)
      totalImported += imported
    }
    
    console.log(`\nВсего импортировано: ${totalImported} промптов`)
    
    // Обновляем счетчики категорий
    console.log('Обновляем счетчики категорий...')
    for (const category of categories) {
      const count = await prisma.prompt.count({
        where: { categoryId: category.id }
      })
      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount: count }
      })
      console.log(`Категория ${category.nameEn}: ${count} промптов`)
    }
    
    console.log('Все промпты пользователей восстановлены!')
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

restoreAllPrompts().finally(() => prisma.$disconnect())
