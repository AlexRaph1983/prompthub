const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking data integrity...\n');
    
    // Проверяем количество промптов
    const promptCount = await prisma.prompt.count();
    console.log(`📊 Total prompts: ${promptCount}`);
    
    // Проверяем категории
    const categoryCount = await prisma.category.count();
    console.log(`📁 Total categories: ${categoryCount}`);
    
    // Проверяем теги
    const tagCount = await prisma.tag.count();
    console.log(`🏷️ Total tags: ${tagCount}`);
    
    // Проверяем связь промптов с категориями
    const promptsWithCategory = await prisma.prompt.count({
      where: { categoryId: { not: null } }
    });
    console.log(`🔗 Prompts linked to new categories: ${promptsWithCategory}`);
    
    // Проверяем старые категории
    const oldCategories = await prisma.prompt.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    console.log('\n📋 Old categories still in use:');
    oldCategories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat._count.category} prompts`);
    });
    
    // Проверяем новые категории
    const newCategories = await prisma.category.findMany({
      select: {
        nameRu: true,
        slug: true,
        promptCount: true
      },
      orderBy: { promptCount: 'desc' }
    });
    
    console.log('\n🆕 New categories:');
    newCategories.forEach(cat => {
      console.log(`  - ${cat.nameRu} (${cat.slug}): ${cat.promptCount} prompts`);
    });
    
    console.log('\n✅ Data integrity check completed!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
