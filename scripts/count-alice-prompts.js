const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function main() {
  try {
    console.log('🔍 Считаем промпты пользователя Алиса...');

    const user = await prisma.user.findFirst({
      where: { email: 'alice@prompthub.local' },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('❌ Пользователь Алиса (alice@prompthub.local) не найден');
      return;
    }

    const count = await prisma.prompt.count({
      where: { authorId: user.id }
    });

    console.log(`👤 Алиса: ${user.id} (${user.email})`);
    console.log(`📊 Количество промптов Алисы: ${count}`);

    const titles = await prisma.prompt.findMany({
      where: { authorId: user.id },
      select: { title: true, category: true },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n📝 Заголовки промптов Алисы:');
    titles.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} [category="${p.category}"]`);
    });
  } catch (e) {
    console.error('❌ Ошибка при подсчёте промптов Алисы:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();




