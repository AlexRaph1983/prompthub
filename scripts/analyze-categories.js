const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCategories() {
  try {
    console.log('🔍 Анализируем текущие категории промптов...');
    
    // Получаем все промпты с их категориями
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        category: true
      }
    });
    
    console.log(`📊 Найдено промптов: ${prompts.length}`);
    
    // Группируем по категориям
    const categoryGroups = {};
    prompts.forEach(prompt => {
      const category = prompt.category || 'Без категории';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(prompt);
    });
    
    console.log('\n📋 Текущие категории:');
    Object.keys(categoryGroups).forEach(category => {
      console.log(`  - ${category}: ${categoryGroups[category].length} промптов`);
    });
    
    // Проверяем существующие категории в новой системе
    console.log('\n🏷️ Существующие категории в новой системе:');
    const existingCategories = await prisma.category.findMany({
      select: {
        nameRu: true,
        nameEn: true,
        slug: true,
        promptCount: true
      }
    });
    
    existingCategories.forEach(cat => {
      console.log(`  - ${cat.nameRu} (${cat.slug}): ${cat.promptCount} промптов`);
    });
    
    // Маппинг старых категорий на новые
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
      'Cooking': 'cooking'
    };
    
    console.log('\n🔄 Предлагаемый маппинг:');
    Object.keys(categoryGroups).forEach(oldCategory => {
      const newSlug = categoryMapping[oldCategory] || 'other';
      console.log(`  ${oldCategory} → ${newSlug}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при анализе категорий:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCategories();
