const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixNewPromptsCategories() {
  try {
    console.log('🔧 Исправляем связи новых промптов с категориями...')
    
    // Получаем все категории
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        slug: true
      }
    })
    
    console.log(`📁 Найдено ${categories.length} категорий`)
    
    // Создаем маппинг категорий
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id
      categoryMap[cat.nameEn] = cat.id
      categoryMap[cat.nameRu] = cat.id
    })
    
    // Маппинг старых категорий на новые slug
    const categoryMapping = {
      'Video': 'video',
      'Audio': 'audio', 
      'Design': 'design',
      'Image': 'image',
      'Writing': 'marketing-writing', // Исправлено: Writing -> marketing-writing
      'Productivity': 'productivity',
      'Creative': 'creative',
      'Business': 'business',
      'Marketing': 'marketing-writing',
      'Code': 'code',
      'Education': 'education',
      'Health': 'health',
      'Finance': 'finance',
      'Legal': 'legal',
      'SEO': 'seo',
      'Research': 'research',
      'Analysis': 'analysis',
      'Translation': 'marketing-writing',
      'Gaming': 'gaming',
      'Cooking': 'cooking',
      'Chat': 'chat',
      '3D': '3d',
      'Animation': 'animation',
      'Music': 'music'
    }
    
    // Получаем новые промпты (без categoryId)
    const newPrompts = await prisma.prompt.findMany({
      where: {
        categoryId: null,
        authorId: {
          contains: 'promptmaster'
        }
      },
      select: {
        id: true,
        title: true,
        category: true
      }
    })
    
    console.log(`🔍 Найдено ${newPrompts.length} новых промптов без связи с категориями`)
    
    let linkedCount = 0
    let skippedCount = 0
    
    for (const prompt of newPrompts) {
      const oldCategory = prompt.category
      const newSlug = categoryMapping[oldCategory]
      
      if (newSlug && categoryMap[newSlug]) {
        // Обновляем промпт с правильным categoryId
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { categoryId: categoryMap[newSlug] }
        })
        
        console.log(`✅ Связан: "${prompt.title}" (${oldCategory} → ${newSlug})`)
        linkedCount++
      } else {
        console.log(`⚠️  Пропущен: "${prompt.title}" (${oldCategory}) - нет маппинга`)
        skippedCount++
      }
    }
    
    console.log(`\n📊 Результаты связывания:`)
    console.log(`✅ Связано: ${linkedCount}`)
    console.log(`⚠️  Пропущено: ${skippedCount}`)
    
    // Обновляем счетчики категорий
    console.log('\n🔄 Обновляем счетчики категорий...')
    
    for (const category of categories) {
      const count = await prisma.prompt.count({
        where: { categoryId: category.id }
      })
      
      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount: count }
      })
      
      console.log(`✅ ${category.nameRu}: ${count} промптов`)
    }
    
    console.log('\n🎉 Исправление завершено!')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixNewPromptsCategories()
