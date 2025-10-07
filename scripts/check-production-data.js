const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductionData() {
  try {
    console.log('🔍 Проверка целостности данных на продакшене...\n');
    
    // Проверяем количество промптов
    const promptCount = await prisma.prompt.count();
    console.log(`📊 Всего промптов: ${promptCount}`);
    
    // Проверяем категории
    const categoryCount = await prisma.category.count();
    console.log(`📁 Всего категорий: ${categoryCount}`);
    
    // Проверяем теги
    const tagCount = await prisma.tag.count();
    console.log(`🏷️ Всего тегов: ${tagCount}`);
    
    // Проверяем связь промптов с категориями
    const promptsWithCategory = await prisma.prompt.count({
      where: { categoryId: { not: null } }
    });
    console.log(`🔗 Промптов связанных с новыми категориями: ${promptsWithCategory}`);
    
    // Проверяем старые категории
    const oldCategories = await prisma.prompt.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    if (oldCategories.length > 0) {
      console.log('\n📋 Старые категории в использовании:');
      oldCategories.forEach(cat => {
        console.log(`  - ${cat.category}: ${cat._count.category} промптов`);
      });
    } else {
      console.log('\n📋 Старые категории: не найдены');
    }
    
    // Проверяем новые категории
    const newCategories = await prisma.category.findMany({
      select: {
        nameRu: true,
        slug: true,
        promptCount: true,
        isActive: true
      },
      orderBy: { promptCount: 'desc' }
    });
    
    console.log('\n🆕 Новые категории:');
    newCategories.forEach(cat => {
      const status = cat.isActive ? '✅' : '❌';
      console.log(`  ${status} ${cat.nameRu} (${cat.slug}): ${cat.promptCount} промптов`);
    });
    
    // Проверяем теги
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
        slug: true,
        promptCount: true,
        isNsfw: true,
        isActive: true
      },
      orderBy: { promptCount: 'desc' }
    });
    
    console.log('\n🏷️ Теги:');
    tags.forEach(tag => {
      const status = tag.isActive ? '✅' : '❌';
      const nsfw = tag.isNsfw ? ' [NSFW]' : '';
      console.log(`  ${status} ${tag.name}${nsfw}: ${tag.promptCount} промптов`);
    });
    
    // Проверяем подкатегории
    const subcategories = await prisma.category.findMany({
      where: { parentId: { not: null } },
      select: {
        nameRu: true,
        slug: true,
        parent: {
          select: { nameRu: true }
        }
      }
    });
    
    if (subcategories.length > 0) {
      console.log('\n🌳 Подкатегории:');
      subcategories.forEach(sub => {
        console.log(`  - ${sub.nameRu} (родитель: ${sub.parent.nameRu})`);
      });
    }
    
    // Проверяем производительность
    console.log('\n⚡ Проверка производительности...');
    const startTime = Date.now();
    await prisma.prompt.findMany({ take: 10 });
    const queryTime = Date.now() - startTime;
    console.log(`  Время запроса (10 промптов): ${queryTime}ms`);
    
    console.log('\n✅ Проверка целостности данных завершена!');
    
    // Рекомендации
    if (promptCount > 0 && promptsWithCategory === 0) {
      console.log('\n💡 Рекомендация: У вас есть промпты, но они не связаны с новыми категориями.');
      console.log('   Запустите миграцию: node scripts/migrate-existing-prompts.js');
    }
    
    if (categoryCount === 0) {
      console.log('\n💡 Рекомендация: Категории не найдены. Запустите: node scripts/seed-categories.js');
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionData();
