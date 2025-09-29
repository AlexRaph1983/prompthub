const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearchTracking() {
  console.log('🔍 Тестируем API отслеживания поиска...');
  
  const testData = {
    query: 'тестовый запрос',
    resultsCount: 5,
    clickedResult: null,
    sessionId: 'test-session-123'
  };

  try {
    console.log('📤 Отправляем тестовые данные:', testData);
    const response = await fetch('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`✅ Ответ сервера: ${response.status} ${response.statusText}`);
    const result = await response.json();
    console.log('👍 Успешно:', result);

    // Проверяем, что запись появилась в базе данных
    const count = await prisma.searchQuery.count();
    console.log(`📊 Записей в базе после теста: ${count}`);

    const latestQuery = await prisma.searchQuery.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('📝 Последняя запись:', latestQuery);

  } catch (error) {
    console.error('❌ Ошибка при тестировании API отслеживания поиска:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearchTracking();