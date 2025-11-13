const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, nameRu: true, nameEn: true },
    orderBy: { slug: 'asc' }
  });
  
  console.log(JSON.stringify(categories, null, 2));
  await prisma.$disconnect();
}

checkCategories();

