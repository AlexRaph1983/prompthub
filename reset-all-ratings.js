const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAllRatings() {
  try {
    console.log('🔄 Обнуляем все оценки в промптах...');
    
    // Получаем все промпты с оценками
    const promptsWithRatings = await prisma.prompt.findMany({
      where: {
        OR: [
          { rating: { not: 0 } },
          { ratingCount: { not: 0 } },
          { totalRatings: { not: 0 } },
          { averageRating: { not: 0 } }
        ]
      },
      select: {
        id: true,
        title: true,
        rating: true,
        ratingCount: true,
        totalRatings: true,
        averageRating: true
      }
    });
    
    console.log(`Найдено ${promptsWithRatings.length} промптов с оценками`);
    
    if (promptsWithRatings.length > 0) {
      console.log('\n📊 Промпты с оценками:');
      promptsWithRatings.forEach(prompt => {
        console.log(`- ${prompt.title}: rating=${prompt.rating}, ratingCount=${prompt.ratingCount}, totalRatings=${prompt.totalRatings}, averageRating=${prompt.averageRating}`);
      });
    }
    
    // Обнуляем все оценки
    const result = await prisma.prompt.updateMany({
      data: {
        rating: 0,
        ratingCount: 0,
        totalRatings: 0,
        averageRating: 0
      }
    });
    
    console.log(`\n✅ Обновлено ${result.count} промптов`);
    
    // Проверяем результат
    const remainingRatings = await prisma.prompt.findMany({
      where: {
        OR: [
          { rating: { not: 0 } },
          { ratingCount: { not: 0 } },
          { totalRatings: { not: 0 } },
          { averageRating: { not: 0 } }
        ]
      },
      select: {
        id: true,
        title: true,
        rating: true,
        ratingCount: true,
        totalRatings: true,
        averageRating: true
      }
    });
    
    if (remainingRatings.length === 0) {
      console.log('🎉 Все оценки успешно обнулены!');
    } else {
      console.log(`⚠️ Осталось ${remainingRatings.length} промптов с оценками:`);
      remainingRatings.forEach(prompt => {
        console.log(`- ${prompt.title}: rating=${prompt.rating}, ratingCount=${prompt.ratingCount}, totalRatings=${prompt.totalRatings}, averageRating=${prompt.averageRating}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при обнулении оценок:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllRatings();
