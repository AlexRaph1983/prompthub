const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function testUserCount() {
  try {
    console.log('🔍 Тестируем подсчет пользователей...')
    
    const totalUsers = await prisma.user.count()
    console.log(`Всего пользователей: ${totalUsers}`)
    
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
    
    console.log(`\n✅ Всего пользователей: ${totalUsers}`)
    
  } catch (e) {
    console.error('❌ Ошибка:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

testUserCount()
