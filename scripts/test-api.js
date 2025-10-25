const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPI() {
  try {
    console.log('Тестируем API логику...')
    
    // Получаем теги из таблицы Tag
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        promptCount: true,
      },
      take: 50, // Получаем больше тегов для подсчета
    });

    console.log('Найдено тегов:', tags.length)

    // Используем уже подсчитанный promptCount из базы
    const formattedTags = tags
      .filter(tag => tag.promptCount > 0)
      .sort((a, b) => b.promptCount - a.promptCount)
      .slice(0, 20) // Топ 20 тегов
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        promptCount: tag.promptCount,
        color: tag.color,
      }));

    console.log('Отфильтровано тегов:', formattedTags.length)
    console.log('Первые 5 тегов:', formattedTags.slice(0, 5))
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

testAPI().finally(() => prisma.$disconnect())
