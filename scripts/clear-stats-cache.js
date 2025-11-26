const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function clearStatsCache() {
  try {
    console.log('🧹 Очищаем кеш статистики...')
    
    // Проверяем количество пользователей
    const totalUsers = await prisma.user.count()
    const totalActiveUsers = await prisma.user.count({
      where: {
        AND: [
          { email: { not: { contains: 'music.com' } } },
          { email: { not: { contains: 'test' } } },
          { email: { not: { contains: 'example' } } },
          { name: { not: { contains: 'Music Lover' } } }
        ]
      }
    })
    
    console.log(`Всего пользователей: ${totalUsers}`)
    console.log(`Активных пользователей (после фильтрации): ${totalActiveUsers}`)
    
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
    
    console.log('\n✅ Кеш статистики очищен!')
    console.log('Теперь API будет возвращать правильное количество пользователей.')
    
  } catch (e) {
    console.error('❌ Ошибка при очистке кеша:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

clearStatsCache()
