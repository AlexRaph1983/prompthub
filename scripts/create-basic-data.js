const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createBasicData() {
  try {
    console.log('🚀 Создаем базовые данные...')
    
    // Создаем пользователя
    const user = await prisma.user.upsert({
      where: { id: 'promptmaster' },
      update: {},
      create: {
        id: 'promptmaster',
        name: 'PromptMaster',
        email: 'promptmaster@example.com'
      }
    })
    console.log('✅ Пользователь создан:', user.name)
    
    // Создаем категории
    const categories = [
      { nameRu: 'Видео', nameEn: 'Video', slug: 'video' },
      { nameRu: 'Аудио', nameEn: 'Audio', slug: 'audio' },
      { nameRu: 'Дизайн', nameEn: 'Design', slug: 'design' },
      { nameRu: 'Фото', nameEn: 'Image', slug: 'image' },
      { nameRu: 'Продуктивность', nameEn: 'Productivity', slug: 'productivity' },
      { nameRu: 'Письмо', nameEn: 'Writing', slug: 'writing' }
    ]
    
    for (const catData of categories) {
      const category = await prisma.category.upsert({
        where: { slug: catData.slug },
        update: {},
        create: catData
      })
      console.log('✅ Категория создана:', category.nameRu)
    }
    
    console.log('🎉 Базовые данные созданы!')
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createBasicData()
