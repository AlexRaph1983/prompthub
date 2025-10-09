const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCategories() {
  try {
    console.log('Checking categories in database...');
    
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        slug: true,
        promptCount: true,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.nameRu} (${cat.nameEn}) - ${cat.promptCount} prompts - Active: ${cat.isActive}`);
    });
    
    if (categories.length === 0) {
      console.log('❌ No categories found! Need to seed categories.');
    } else {
      console.log('✅ Categories found in database.');
    }
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
