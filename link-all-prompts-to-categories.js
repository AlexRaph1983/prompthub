const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkAllPromptsToCategories() {
  try {
    console.log('🔗 Связываем все промпты с категориями...');
    
    // Получаем все категории из меню
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        slug: true
      }
    });
    
    console.log(`Найдено ${categories.length} категорий в меню`);
    
    // Создаем маппинг старых категорий на новые
    const categoryMapping = {
      // Прямые соответствия
      'Legal': 'legal',
      'SEO': 'seo', 
      'Video': 'video',
      '3D': '3d',
      'Music': 'music',
      'Analysis': 'analysis',
      'Code': 'code',
      'Image': 'image',
      'Education': 'education',
      'Text': 'chat', // Текстовые промпты -> чат
      
      // Маппинг старых категорий на новые
      'writing': 'marketing-writing',
      'coding': 'code',
      'data-analysis': 'analysis',
      'design': 'design',
      'marketing': 'marketing-writing',
      'education': 'education',
      'productivity': 'productivity',
      'audio': 'audio',
      'video': 'video',
      'devops': 'code',
      'customer-support': 'business',
      'research': 'research',
      'health': 'health',
      'finance': 'finance',
      'lifestyle': 'business',
      'business': 'business',
      'utilities': 'business',
      'social-media': 'marketing-writing',
      'arts': 'creative',
      
      // Дополнительные маппинги
      'Marketing': 'marketing-writing',
      'Writing': 'marketing-writing',
      'Creative': 'creative',
      'Translation': 'marketing-writing',
      'Development': 'code',
      'Art': 'creative'
    };
    
    // Получаем все промпты
    const prompts = await prisma.prompt.findMany({
      where: {
        categoryId: null // Только промпты без связи с категориями
      },
      select: {
        id: true,
        title: true,
        category: true
      }
    });
    
    console.log(`Найдено ${prompts.length} промптов без связи с категориями`);
    
    let linkedCount = 0;
    let skippedCount = 0;
    
    for (const prompt of prompts) {
      const oldCategory = prompt.category;
      const newCategorySlug = categoryMapping[oldCategory];
      
      if (newCategorySlug) {
        const category = categories.find(c => c.slug === newCategorySlug);
        
        if (category) {
          await prisma.prompt.update({
            where: { id: prompt.id },
            data: { categoryId: category.id }
          });
          
          console.log(`✅ Связал "${prompt.title}" (${oldCategory}) -> ${category.nameRu}`);
          linkedCount++;
        } else {
          console.log(`⚠️ Категория не найдена: ${newCategorySlug} для ${oldCategory}`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️ Нет маппинга для категории: ${oldCategory}`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Результат:`);
    console.log(`✅ Связано: ${linkedCount} промптов`);
    console.log(`⚠️ Пропущено: ${skippedCount} промптов`);
    
    // Обновляем счетчики в категориях
    console.log('\n🔄 Обновляем счетчики категорий...');
    for (const category of categories) {
      const count = await prisma.prompt.count({
        where: {
          categoryId: category.id
        }
      });
      
      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount: count }
      });
      
      console.log(`📊 ${category.nameRu}: ${count} промптов`);
    }
    
    console.log('\n🎉 Связывание завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkAllPromptsToCategories();
