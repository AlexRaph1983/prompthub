const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPromptCategories() {
  try {
    console.log('🔍 Проверяем связь промптов с категориями...');
    
    // Проверяем первый промпт
    const prompt = await prisma.prompt.findFirst({
      include: { categoryRef: true }
    });
    
    console.log('Первый промпт:');
    console.log('  - Старая категория (category):', prompt?.category);
    console.log('  - Новая категория (categoryId):', prompt?.categoryId);
    console.log('  - Связь с категорией (categoryRef):', prompt?.categoryRef?.nameRu || 'Нет связи');
    
    // Проверяем количество промптов с categoryId
    const withCategoryId = await prisma.prompt.count({
      where: { categoryId: { not: null } }
    });
    
    const withoutCategoryId = await prisma.prompt.count({
      where: { categoryId: null }
    });
    
    console.log('\n📊 Статистика:');
    console.log(`  - Промптов с categoryId: ${withCategoryId}`);
    console.log(`  - Промптов без categoryId: ${withoutCategoryId}`);
    
    // Проверяем категории
    const categories = await prisma.category.findMany({
      select: { id: true, nameRu: true, slug: true, promptCount: true }
    });
    
    console.log('\n📋 Категории:');
    categories.forEach(cat => {
      console.log(`  - ${cat.nameRu} (${cat.slug}): ${cat.promptCount} промптов`);
    });

  } catch (error) {
    console.error('Ошибка при проверке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPromptCategories();
