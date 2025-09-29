const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugRealSearch() {
  try {
    console.log('🔍 Отладка реальных поисковых запросов...\n')

    // Проверяем все записи в базе
    const allQueries = await prisma.searchQuery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log('📊 Последние 10 записей в базе:')
    allQueries.forEach((query, index) => {
      console.log(`${index + 1}. "${query.query}" - ${query.resultsCount} результатов`)
      console.log(`   Пользователь: ${query.userId || 'Гость'}`)
      console.log(`   IP: ${query.ipHash}`)
      console.log(`   User-Agent: ${query.userAgent?.substring(0, 50)}...`)
      console.log(`   Время: ${query.createdAt.toLocaleString()}`)
      console.log('')
    })

    // Проверяем, есть ли записи от реальных пользователей
    const userQueries = await prisma.searchQuery.findMany({
      where: {
        userId: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`👤 Запросы от авторизованных пользователей: ${userQueries.length}`)

    // Проверяем записи от гостей
    const guestQueries = await prisma.searchQuery.findMany({
      where: {
        userId: null
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`👻 Запросы от гостей: ${guestQueries.length}`)

    // Проверяем уникальные IP
    const uniqueIPs = await prisma.searchQuery.findMany({
      where: {
        ipHash: { not: null }
      },
      select: {
        ipHash: true
      },
      distinct: ['ipHash']
    })

    console.log(`🌐 Уникальных IP адресов: ${uniqueIPs.length}`)

    // Проверяем последние записи за последний час
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentQueries = await prisma.searchQuery.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`⏰ Запросы за последний час: ${recentQueries.length}`)

    if (recentQueries.length > 0) {
      console.log('\n🕒 Последние запросы за час:')
      recentQueries.forEach((query, index) => {
        console.log(`${index + 1}. "${query.query}" (${query.createdAt.toLocaleString()})`)
      })
    }

  } catch (error) {
    console.error('❌ Ошибка при отладке:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugRealSearch()
