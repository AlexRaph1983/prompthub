const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupBadPrompts() {
  console.log('🧹 УДАЛЯЮ ПРОМПТЫ С ПЕРЕМЕННЫМИ В ЗАГОЛОВКАХ...\n');

  // Находим промпты с фигурными скобками в заголовках
  const badPrompts = await prisma.prompt.findMany({
    where: {
      OR: [
        { title: { contains: '{' } },
        { title: { contains: '}' } }
      ]
    },
    select: { id: true, title: true }
  });

  console.log(`Найдено ${badPrompts.length} промптов с переменными`);

  badPrompts.slice(0, 5).forEach(p => {
    console.log(`  - "${p.title}"`);
  });

  if (badPrompts.length > 0) {
    const deleteResult = await prisma.prompt.deleteMany({
      where: {
        OR: badPrompts.map(p => ({ id: p.id }))
      }
    });

    console.log(`✅ Удалено ${deleteResult.count} промптов`);
  }

  const finalCount = await prisma.prompt.count();
  console.log(`📊 Итого промптов в базе: ${finalCount}`);

  await prisma.$disconnect();
}

cleanupBadPrompts().catch(console.error);
