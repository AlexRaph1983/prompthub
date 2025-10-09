const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPromptsAndCategories() {
  try {
    console.log('Checking prompts and categories...');
    
    // Проверяем промпты
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        category: true
      }
    });
    
    console.log(`Total prompts: ${prompts.length}`);
    console.log('First 5 prompts with categories:');
    prompts.slice(0, 5).forEach(p => {
      console.log(`- ${p.title} -> ${p.category}`);
    });
    
    // Проверяем категории
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        promptCount: true
      }
    });
    
    console.log(`\nTotal categories: ${categories.length}`);
    console.log('Categories with counts:');
    categories.forEach(cat => {
      console.log(`- ${cat.nameRu} (${cat.nameEn}): ${cat.promptCount} prompts`);
    });
    
    // Проверяем связь промптов с категориями
    const categoryMap = {};
    prompts.forEach(prompt => {
      if (prompt.category) {
        categoryMap[prompt.category] = (categoryMap[prompt.category] || 0) + 1;
      }
    });
    
    console.log('\nPrompts by category (from prompt.category field):');
    Object.entries(categoryMap).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} prompts`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPromptsAndCategories();
