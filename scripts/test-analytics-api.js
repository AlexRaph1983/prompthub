const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Тестируем API аналитики поиска...\n')

    // Проверяем данные в базе
    const totalCount = await prisma.searchQuery.count()
    console.log(`📊 Всего записей в SearchQuery: ${totalCount}`)

    if (totalCount === 0) {
      console.log('❌ Нет данных для анализа')
      return
    }

    // Тестируем запросы аналитики напрямую
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    console.log('\n🔍 Тестируем запросы аналитики...')

    // Топ запросы
    const topQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        query: true
      },
      _avg: {
        resultsCount: true
      },
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: 10
    })

    console.log('📈 Топ запросы:', topQueries)

    // Общая статистика
    const totalStats = await prisma.searchQuery.aggregate({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        resultsCount: true
      }
    })

    console.log('📊 Общая статистика:', {
      totalSearches: Number(totalStats._count.id),
      averageResults: Number(totalStats._avg.resultsCount?.toFixed(2) || 0)
    })

    // Последние запросы
    const recentQueries = await prisma.searchQuery.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        query: true,
        userId: true,
        resultsCount: true,
        clickedResult: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    console.log('🕒 Последние запросы:', recentQueries)

  } catch (error) {
    console.error('❌ Ошибка при тестировании аналитики:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAnalyticsAPI()
