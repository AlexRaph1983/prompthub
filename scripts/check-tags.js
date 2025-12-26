const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentTags() {
  console.log('🔍 ПРОВЕРКА ТЕГОВ В ДОБАВЛЕННЫХ ПРОМПТАХ:\n');

  const recentPrompts = await prisma.prompt.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { title: true, tags: true, category: true }
  });

  recentPrompts.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   Теги: ${p.tags}`);
    console.log(`   Категория: ${p.category}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkCurrentTags().catch(console.error);