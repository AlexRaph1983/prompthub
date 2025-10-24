const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createCategories() {
  try {
    console.log('🏗️ Создаем категории...')
    
    const categories = [
      { nameRu: 'Видео', nameEn: 'Video', slug: 'video', descriptionRu: 'Промпты для создания видео', descriptionEn: 'Video creation prompts' },
      { nameRu: 'Аудио', nameEn: 'Audio', slug: 'audio', descriptionRu: 'Промпты для создания аудио', descriptionEn: 'Audio creation prompts' },
      { nameRu: 'Дизайн', nameEn: 'Design', slug: 'design', descriptionRu: 'Промпты для дизайна', descriptionEn: 'Design prompts' },
      { nameRu: 'Фото', nameEn: 'Image', slug: 'image', descriptionRu: 'Промпты для создания изображений', descriptionEn: 'Image creation prompts' },
      { nameRu: 'Продуктивность', nameEn: 'Productivity', slug: 'productivity', descriptionRu: 'Промпты для повышения продуктивности', descriptionEn: 'Productivity prompts' },
      { nameRu: 'Письмо', nameEn: 'Writing', slug: 'writing', descriptionRu: 'Промпты для написания текстов', descriptionEn: 'Writing prompts' },
      { nameRu: 'Маркетинг', nameEn: 'Marketing', slug: 'marketing', descriptionRu: 'Промпты для маркетинга', descriptionEn: 'Marketing prompts' },
      { nameRu: 'Бизнес', nameEn: 'Business', slug: 'business', descriptionRu: 'Промпты для бизнеса', descriptionEn: 'Business prompts' },
      { nameRu: 'Образование', nameEn: 'Education', slug: 'education', descriptionRu: 'Промпты для образования', descriptionEn: 'Education prompts' },
      { nameRu: 'Здоровье', nameEn: 'Health', slug: 'health', descriptionRu: 'Промпты для здоровья', descriptionEn: 'Health prompts' },
      { nameRu: 'Финансы', nameEn: 'Finance', slug: 'finance', descriptionRu: 'Промпты для финансов', descriptionEn: 'Finance prompts' },
      { nameRu: 'Юриспруденция', nameEn: 'Legal', slug: 'legal', descriptionRu: 'Промпты для юридических вопросов', descriptionEn: 'Legal prompts' },
      { nameRu: 'SEO', nameEn: 'SEO', slug: 'seo', descriptionRu: 'Промпты для SEO', descriptionEn: 'SEO prompts' },
      { nameRu: 'Исследования', nameEn: 'Research', slug: 'research', descriptionRu: 'Промпты для исследований', descriptionEn: 'Research prompts' },
      { nameRu: 'Анализ', nameEn: 'Analysis', slug: 'analysis', descriptionRu: 'Промпты для анализа', descriptionEn: 'Analysis prompts' },
      { nameRu: 'Перевод', nameEn: 'Translation', slug: 'translation', descriptionRu: 'Промпты для перевода', descriptionEn: 'Translation prompts' },
      { nameRu: 'Игры', nameEn: 'Gaming', slug: 'gaming', descriptionRu: 'Промпты для игр', descriptionEn: 'Gaming prompts' },
      { nameRu: 'Кулинария', nameEn: 'Cooking', slug: 'cooking', descriptionRu: 'Промпты для кулинарии', descriptionEn: 'Cooking prompts' },
      { nameRu: 'Чат', nameEn: 'Chat', slug: 'chat', descriptionRu: 'Промпты для чата', descriptionEn: 'Chat prompts' },
      { nameRu: '3D', nameEn: '3D', slug: '3d', descriptionRu: 'Промпты для 3D', descriptionEn: '3D prompts' },
      { nameRu: 'Анимация', nameEn: 'Animation', slug: 'animation', descriptionRu: 'Промпты для анимации', descriptionEn: 'Animation prompts' },
      { nameRu: 'Музыка', nameEn: 'Music', slug: 'music', descriptionRu: 'Промпты для музыки', descriptionEn: 'Music prompts' },
      { nameRu: 'Код', nameEn: 'Code', slug: 'code', descriptionRu: 'Промпты для программирования', descriptionEn: 'Code prompts' },
      { nameRu: 'Творчество', nameEn: 'Creative', slug: 'creative', descriptionRu: 'Промпты для творчества', descriptionEn: 'Creative prompts' }
    ]
    
    let created = 0
    let skipped = 0
    
    for (const categoryData of categories) {
      try {
        const existing = await prisma.category.findFirst({
          where: { slug: categoryData.slug }
        })
        
        if (existing) {
          console.log(`⏭️  Пропускаем: ${categoryData.nameRu} (уже существует)`)
          skipped++
          continue
        }
        
        await prisma.category.create({
          data: categoryData
        })
        
        console.log(`✅ Создана: ${categoryData.nameRu}`)
        created++
      } catch (error) {
        console.error(`❌ Ошибка при создании "${categoryData.nameRu}":`, error)
        skipped++
      }
    }
    
    console.log(`\n📊 Результаты создания категорий:`)
    console.log(`✅ Создано: ${created}`)
    console.log(`⏭️  Пропущено: ${skipped}`)
    
    console.log('\n🎉 Создание категорий завершено!')
  } catch (error) {
    console.error('❌ Критическая ошибка при создании категорий:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCategories()
