const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function testStatsDirect() {
  try {
    console.log('🔍 Тестируем API статистики напрямую...')
    
    // Симулируем точно то, что делает API /api/stats
    const [
      totalUsers,
      totalActiveUsers,
      totalPrompts,
      totalRatings,
      totalReviews
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          AND: [
            { email: { not: { contains: 'music.com' } } },
            { email: { not: { contains: 'test' } } },
            { email: { not: { contains: 'example' } } },
            { name: { not: { contains: 'Music Lover' } } }
          ]
        }
      }),
      prisma.prompt.count(),
      prisma.rating.count(),
      prisma.review.count()
    ])
    
    console.log('\n=== РЕЗУЛЬТАТЫ ПОДСЧЕТА ===')
    console.log(`totalUsers: ${totalUsers}`)
    console.log(`totalActiveUsers: ${totalActiveUsers}`)
    console.log(`totalPrompts: ${totalPrompts}`)
    console.log(`totalRatings: ${totalRatings}`)
    console.log(`totalReviews: ${totalReviews}`)
    
    // Симулируем то, что должно возвращать API (исправленная версия)
    const stats = {
      users: totalUsers, // Используем totalUsers вместо totalActiveUsers
      prompts: totalPrompts,
      views: 24, // Примерное значение
      ratings: totalRatings,
      reviews: totalReviews,
      timestamp: new Date().toISOString()
    }
    
    console.log('\n=== ОЖИДАЕМЫЙ РЕЗУЛЬТАТ API ===')
    console.log(JSON.stringify(stats, null, 2))
    
    console.log('\n=== ПРОБЛЕМА ===')
    if (totalActiveUsers === 0) {
      console.log('❌ totalActiveUsers = 0 (все пользователи исключены)')
      console.log('✅ totalUsers = ' + totalUsers + ' (правильное значение)')
      console.log('🔧 РЕШЕНИЕ: Использовать totalUsers вместо totalActiveUsers')
    } else {
      console.log('✅ Подсчет работает корректно')
    }
    
  } catch (e) {
    console.error('❌ Ошибка при тестировании API:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

testStatsDirect()
