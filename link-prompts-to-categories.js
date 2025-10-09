const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Маппинг старых категорий на новые
const categoryMapping = {
  'Legal': 'legal',
  'Photography': 'photography', 
  'Health': 'health',
  'Photo Editing': 'photo-editing',
  'Education': 'education',
  'NSFW 18+': 'nsfw',
  'Marketing & Writing': 'marketing-writing',
  'Image': 'image',
  'Video': 'video',
  'Chat': 'chat',
  'Code': 'code',
  'SEO': 'seo',
  'Design': 'design',
  'Music': 'music',
  'Audio': 'audio',
  '3D': '3d',
  'Animation': 'animation',
  'Business': 'business'
};

async function linkPromptsToCategories() {
  try {
    console.log('🔗 Linking prompts to categories...');
    
    // Получаем все категории
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, nameRu: true }
    });
    
    console.log(`Found ${categories.length} categories`);
    
    // Создаем маппинг slug -> categoryId
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });
    
    // Получаем все промпты с категориями
    const prompts = await prisma.prompt.findMany({
      where: {
        category: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        category: true
      }
    });
    
    console.log(`Found ${prompts.length} prompts with categories`);
    
    let linkedCount = 0;
    let skippedCount = 0;
    
    for (const prompt of prompts) {
      const oldCategory = prompt.category;
      const newSlug = categoryMapping[oldCategory];
      
      if (newSlug && categoryMap[newSlug]) {
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { categoryId: categoryMap[newSlug] }
        });
        console.log(`✅ Linked "${prompt.title}" (${oldCategory}) -> ${newSlug}`);
        linkedCount++;
      } else {
        console.log(`⚠️  Skipped "${prompt.title}" (${oldCategory}) - no mapping found`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Linking completed!`);
    console.log(`✅ Linked: ${linkedCount} prompts`);
    console.log(`⚠️  Skipped: ${skippedCount} prompts`);
    
    // Обновляем счетчики
    console.log('\n🔄 Updating category counts...');
    await prisma.category.updateMany({
      data: { promptCount: 0 }
    });
    
    const categoryCounts = await prisma.prompt.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: {
          not: null
        }
      },
      _count: {
        id: true
      }
    });
    
    for (const count of categoryCounts) {
      await prisma.category.update({
        where: { id: count.categoryId },
        data: { promptCount: count._count.id }
      });
      
      const category = categories.find(c => c.id === count.categoryId);
      console.log(`✅ ${category?.nameRu}: ${count._count.id} prompts`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkPromptsToCategories();
