const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getSearchStats() {
  try {
    const days = parseInt(process.argv[2]) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`📊 Статистика поисковых запросов за последние ${days} дней`)
    console.log(`Период: ${startDate.toLocaleDateString('ru-RU')} - ${new Date().toLocaleDateString('ru-RU')}`)
    console.log('─'.repeat(60))

    // Общая статистика
    const totalSearches = await prisma.searchQuery.count({
      where: { createdAt: { gte: startDate } }
    })

    const uniqueUsers = await prisma.searchQuery.findMany({
      where: { createdAt: { gte: startDate } },
      select: { userId: true, ipHash: true },
      distinct: ['userId', 'ipHash']
    })

    const avgResults = await prisma.searchQuery.aggregate({
      where: { createdAt: { gte: startDate } },
      _avg: { resultsCount: true }
    })

    console.log(`Всего поисков: ${totalSearches}`)
    console.log(`Уникальные пользователи: ${uniqueUsers.length}`)
    console.log(`Средние результаты: ${avgResults._avg.resultsCount?.toFixed(2) || 0}`)
    console.log()

    // Топ запросы
    console.log('🔥 Топ-10 поисковых запросов:')
    const topQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: { createdAt: { gte: startDate } },
      _count: { query: true },
      _avg: { resultsCount: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10
    })

    topQueries.forEach((q, i) => {
      console.log(`${i + 1}. "${q.query}" - ${q._count.query} поисков (${q._avg.resultsCount?.toFixed(1)} результатов)`)
    })
    console.log()

    // Запросы без результатов
    console.log('⚠️  Топ-5 запросов без результатов:')
    const zeroQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: { 
        createdAt: { gte: startDate },
        resultsCount: 0
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 5
    })

    if (zeroQueries.length > 0) {
      zeroQueries.forEach((q, i) => {
        console.log(`${i + 1}. "${q.query}" - ${q._count.query} неудачных поисков`)
      })
    } else {
      console.log('Все запросы возвращают результаты! 🎉')
    }
    console.log()

    // Статистика по дням
    console.log('📈 Активность по дням:')
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as searches,
        COUNT(DISTINCT COALESCE(userId, ipHash)) as unique_users
      FROM SearchQuery 
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 7
    `

    dailyStats.reverse().forEach(day => {
      console.log(`${day.date}: ${Number(day.searches)} поисков от ${Number(day.unique_users)} пользователей`)
    })

  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

console.log('Использование: node scripts/search-stats.js [дни]')
console.log('Пример: node scripts/search-stats.js 30\n')

getSearchStats()
