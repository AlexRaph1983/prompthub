const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        nameRu: true,
        nameEn: true,
        isActive: true
      },
      orderBy: {
        slug: 'asc'
      }
    });
    
    console.log('Категории в базе данных:');
    console.log(JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();

