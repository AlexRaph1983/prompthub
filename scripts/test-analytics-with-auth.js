const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAnalyticsWithAuth() {
  try {
    console.log('🧪 Тестируем API аналитики с авторизацией...\n')

    // Сначала проверим, есть ли админский пользователь
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'yegorovaleksandr@gmail.com'
      }
    })

    console.log('👤 Админский пользователь:', adminUser ? 'Найден' : 'Не найден')

    if (!adminUser) {
      console.log('❌ Админский пользователь не найден в базе!')
      return
    }

    // Проверяем API с разными способами авторизации
    console.log('\n🔐 Тестируем API с разными заголовками...')

    // Тест 1: Без авторизации
    try {
      const response1 = await fetch('http://localhost:3000/api/admin/search-analytics?days=30')
      console.log('📤 Без авторизации:', response1.status, response1.statusText)
      if (!response1.ok) {
        const error1 = await response1.text()
        console.log('❌ Ошибка:', error1)
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message)
    }

    // Тест 2: С API ключом
    try {
      const response2 = await fetch('http://localhost:3000/api/admin/search-analytics?days=30', {
        headers: {
          'Authorization': 'Bearer test-api-key',
          'X-API-Key': 'test-api-key'
        }
      })
      console.log('📤 С API ключом:', response2.status, response2.statusText)
      if (!response2.ok) {
        const error2 = await response2.text()
        console.log('❌ Ошибка:', error2)
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message)
    }

    // Тест 3: Проверяем, что возвращает API при ошибке авторизации
    try {
      const response3 = await fetch('http://localhost:3000/api/admin/search-analytics?days=30')
      const result3 = await response3.json()
      console.log('📥 Результат API:', result3)
    } catch (error) {
      console.log('❌ Ошибка парсинга:', error.message)
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAnalyticsWithAuth()
