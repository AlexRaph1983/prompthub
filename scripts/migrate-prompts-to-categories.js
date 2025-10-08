const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migratePromptsToCategories() {
  try {
    console.log('🔄 Мигрируем промпты в новую систему категорий...');
    
    // Маппинг старых категорий на новые slug
    const categoryMapping = {
      'Music': 'music',
      'Audio': 'audio', 
      'audio': 'audio',
      'Video': 'video',
      'Writing': 'marketing',
      'writing': 'marketing',
      'Arts': 'design',
      'arts': 'design',
      'Lifestyle': 'business',
      'lifestyle': 'business',
      'Health': 'health',
      'Legal': 'legal',
      'Education': 'education',
      'Marketing': 'marketing',
      'Design': 'design',
      'Code': 'code',
      'SEO': 'seo',
      'Chat': 'chat',
      'Image': 'image',
      '3D': '3d',
      'Animation': 'animation',
      'Business': 'business',
      'Research': 'research',
      'Analysis': 'analysis',
      'Creative': 'creative',
      'Productivity': 'productivity',
      'Gaming': 'gaming',
      'Finance': 'finance',
      'Cooking': 'cooking',
      'DevOps': 'code', // DevOps → программирование
      'Customer Support': 'business', // Customer Support → бизнес
      'Utilities': 'productivity', // Utilities → продуктивность
      'Translation': 'marketing' // Translation → написание текстов
    };
    
    // Получаем все промпты
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        category: true
      }
    });
    
    console.log(`📊 Найдено промптов: ${prompts.length}`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const prompt of prompts) {
      const oldCategory = prompt.category;
      const newSlug = categoryMapping[oldCategory];
      
      if (!newSlug) {
        console.log(`⚠️ Пропускаем промпт "${prompt.title}" - неизвестная категория: ${oldCategory}`);
        skippedCount++;
        continue;
      }
      
      // Находим категорию по slug
      const category = await prisma.category.findUnique({
        where: { slug: newSlug }
      });
      
      if (!category) {
        console.log(`⚠️ Категория с slug "${newSlug}" не найдена`);
        skippedCount++;
        continue;
      }
      
      // Обновляем промпт
      await prisma.prompt.update({
        where: { id: prompt.id },
        data: { categoryId: category.id }
      });
      
      console.log(`✅ Мигрирован: "${prompt.title}" (${oldCategory} → ${category.nameRu})`);
      migratedCount++;
    }
    
    console.log(`\n📊 Результаты миграции:`);
    console.log(`  - Мигрировано: ${migratedCount}`);
    console.log(`  - Пропущено: ${skippedCount}`);
    
    // Обновляем счетчики категорий
    console.log('\n📊 Обновляем счетчики категорий...');
    const categories = await prisma.category.findMany();
    
    for (const category of categories) {
      const count = await prisma.prompt.count({
        where: { categoryId: category.id }
      });
      
      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount: count }
      });
      
      console.log(`✅ ${category.nameRu}: ${count} промптов`);
    }
    
    console.log('\n🎉 Миграция завершена!');

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePromptsToCategories();
