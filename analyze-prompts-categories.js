const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzePromptsCategories() {
  try {
    console.log('🔍 Анализируем промпты и их категории...');
    
    // Получаем все промпты
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        categoryId: true
      }
    });
    
    console.log(`Всего промптов: ${prompts.length}`);
    
    // Анализируем распределение по старым категориям
    const byOldCategory = {};
    prompts.forEach(p => {
      const cat = p.category || 'Без категории';
      byOldCategory[cat] = (byOldCategory[cat] || 0) + 1;
    });
    
    console.log('\n📊 Распределение по старым категориям:');
    Object.entries(byOldCategory).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count}`);
    });
    
    // Анализируем связь с новыми категориями
    const promptsWithNewCategory = await prisma.prompt.findMany({
      where: {
        categoryId: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        category: true,
        categoryId: true,
        categoryRef: {
          select: {
            nameRu: true,
            nameEn: true,
            slug: true
          }
        }
      }
    });
    
    console.log(`\n📊 Промпты с новыми категориями: ${promptsWithNewCategory.length}`);
    
    const byNewCategory = {};
    promptsWithNewCategory.forEach(p => {
      const catName = p.categoryRef ? p.categoryRef.nameRu : 'Неизвестная категория';
      byNewCategory[catName] = (byNewCategory[catName] || 0) + 1;
    });
    
    console.log('\n📊 Распределение по новым категориям:');
    Object.entries(byNewCategory).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count}`);
    });
    
    // Получаем все категории из меню
    const menuCategories = await prisma.category.findMany({
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        slug: true,
        promptCount: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    console.log('\n📋 Категории в меню:');
    menuCategories.forEach(cat => {
      console.log(`- ${cat.nameRu} (${cat.slug}): ${cat.promptCount} промптов`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePromptsCategories();
