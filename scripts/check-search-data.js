const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSearchData() {
  console.log('🔍 Проверяем данные поиска...');
  try {
    const count = await prisma.searchQuery.count();
    console.log(`📊 Всего записей в SearchQuery: ${count}`);

    if (count === 0) {
      console.log('❌ Данных нет! Проверьте интеграцию отслеживания поиска.');
    } else {
      const latestQueries = await prisma.searchQuery.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });
      console.log('📝 Последние 5 запросов:');
      latestQueries.forEach((query, index) => {
        console.log(`${index + 1}. "${query.query}" (Результатов: ${query.resultsCount}, Пользователь: ${query.userId || 'Гость'})`);
      });
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке данных поиска:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSearchData();