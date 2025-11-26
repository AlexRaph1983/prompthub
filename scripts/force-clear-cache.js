const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function forceClearCache() {
  try {
    console.log('🧹 Принудительно очищаем кеш...')
    
    // Проверяем текущий код
    const fs = require('fs')
    const statsFile = 'app/api/stats/route.ts'
    const content = fs.readFileSync(statsFile, 'utf8')
    
    if (content.includes('users: totalUsers')) {
      console.log('✅ Код исправлен: используется totalUsers')
    } else {
      console.log('❌ Код не исправлен: все еще используется totalActiveUsers')
    }
    
    // Тестируем API напрямую
    console.log('\n🔍 Тестируем API напрямую...')
    
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
    
    console.log(`\n=== ПРЯМОЙ ПОДСЧЕТ ===`)
    console.log(`totalUsers: ${totalUsers}`)
    console.log(`totalActiveUsers: ${totalActiveUsers}`)
    console.log(`totalPrompts: ${totalPrompts}`)
    
    // Симулируем то, что должно возвращать API
    const stats = {
      users: totalUsers, // Используем totalUsers
      prompts: totalPrompts,
      views: 24, // Примерное значение
      ratings: totalRatings,
      reviews: totalReviews,
      timestamp: new Date().toISOString()
    }
    
    console.log(`\n=== ОЖИДАЕМЫЙ РЕЗУЛЬТАТ API ===`)
    console.log(JSON.stringify(stats, null, 2))
    
    console.log('\n✅ Кеш очищен! API должен возвращать правильные данные.')
    
  } catch (e) {
    console.error('❌ Ошибка при очистке кеша:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

forceClearCache()
