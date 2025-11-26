const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function testStatsAPI() {
  try {
    console.log('🔍 Тестируем API статистики...')
    
    // Симулируем то, что делает API /api/stats
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
    
    // Проверяем пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    console.log('\n=== ПОЛЬЗОВАТЕЛИ ===')
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email})`)
    })
    
    // Проверяем, какие пользователи исключаются
    const excludedUsers = users.filter(user => 
      user.email.includes('example') || 
      user.email.includes('test') || 
      user.email.includes('music.com') ||
      user.name.includes('Music Lover')
    )
    
    console.log('\n=== ИСКЛЮЧЕННЫЕ ПОЛЬЗОВАТЕЛИ ===')
    excludedUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email}) - ИСКЛЮЧЕН`)
    })
    
    console.log(`\n=== ВЫВОД ===`)
    console.log(`Всего пользователей: ${totalUsers}`)
    console.log(`Активных пользователей: ${totalActiveUsers}`)
    console.log(`Исключенных пользователей: ${excludedUsers.length}`)
    
    if (totalActiveUsers === 0) {
      console.log('❌ ПРОБЛЕМА: Все пользователи исключены из подсчета!')
      console.log('✅ РЕШЕНИЕ: Использовать totalUsers вместо totalActiveUsers')
    } else {
      console.log('✅ Подсчет работает корректно')
    }
    
  } catch (e) {
    console.error('❌ Ошибка при тестировании API:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

testStatsAPI()
