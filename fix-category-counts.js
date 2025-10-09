const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCategoryCounts() {
  try {
    console.log('🔍 Checking prompts and categories...');
    
    // Получаем все промпты с категориями
    const prompts = await prisma.prompt.findMany({
      select: { category: true }
    });
    
    const promptCategories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
    console.log('Categories in prompts:', promptCategories);
    
    // Получаем все категории из таблицы Category
    const categories = await prisma.category.findMany({
      select: { id: true, nameEn: true, nameRu: true, slug: true }
    });
    
    console.log('Categories in database:');
    categories.forEach(cat => {
      console.log(`- ${cat.nameEn} (${cat.nameRu}) - slug: ${cat.slug}`);
    });
    
    // Обновляем счетчики для каждой категории
    console.log('\n🔄 Updating category counts...');
    
    // Маппинг категорий из промптов на категории в базе
    const categoryMapping = {
      'writing': 'Marketing & Writing',
      'coding': 'Code', 
      'data-analysis': 'Research',
      'design': 'Design',
      'marketing': 'Marketing & Writing',
      'education': 'Education',
      'productivity': 'Productivity',
      'audio': 'Audio',
      'video': 'Video',
      'devops': 'Code',
      'customer-support': 'Business',
      'research': 'Research',
      'health': 'Health',
      'finance': 'Finance',
      'lifestyle': 'Business',
      'business': 'Business',
      'utilities': 'Business',
      'social-media': 'Marketing & Writing',
      'arts': 'Creative'
    };
    
    for (const category of categories) {
      // Ищем промпты по маппингу
      const mappedCategory = categoryMapping[category.slug] || category.nameEn;
      const count = await prisma.prompt.count({
        where: {
          category: mappedCategory
        }
      });
      
      // Обновляем счетчик
      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount: count }
      });
      
      console.log(`✅ ${category.nameRu}: ${count} prompts`);
    }
    
    console.log('\n🎉 Category counts updated!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryCounts();
