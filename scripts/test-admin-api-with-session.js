const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAdminAPIWithSession() {
  try {
    console.log('🧪 Тестируем API админ-панели с сессией...\n')

    // Проверяем, есть ли админский пользователь
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'yegorovaleksandr@gmail.com'
      }
    })

    console.log('👤 Админский пользователь:', adminUser ? 'Найден' : 'Не найден')
    console.log('📧 Email:', adminUser?.email)
    console.log('🆔 ID:', adminUser?.id)

    if (!adminUser) {
      console.log('❌ Админский пользователь не найден в базе!')
      return
    }

    // Проверяем переменные окружения
    console.log('\n🔧 Переменные окружения:')
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL)
    console.log('ADMIN_API_KEY:', process.env.ADMIN_API_KEY ? 'Установлен' : 'Не установлен')

    // Тестируем API с разными способами авторизации
    console.log('\n🔐 Тестируем API с разными заголовками...')

    // Тест 1: Без авторизации
    try {
      const response1 = await fetch('http://localhost:3000/api/admin/dashboard')
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
      const apiKey = process.env.ADMIN_API_KEY
      if (apiKey) {
        const response2 = await fetch('http://localhost:3000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Key': apiKey
          }
        })
        console.log('📤 С API ключом:', response2.status, response2.statusText)
        if (!response2.ok) {
          const error2 = await response2.text()
          console.log('❌ Ошибка:', error2)
        } else {
          const result2 = await response2.json()
          console.log('✅ Успешно:', result2)
        }
      } else {
        console.log('❌ ADMIN_API_KEY не установлен')
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message)
    }

    // Тест 3: Проверяем API check-status
    try {
      const response3 = await fetch('http://localhost:3000/api/admin/check-status')
      console.log('📤 Check-status:', response3.status, response3.statusText)
      if (!response3.ok) {
        const error3 = await response3.text()
        console.log('❌ Ошибка:', error3)
      } else {
        const result3 = await response3.json()
        console.log('✅ Check-status:', result3)
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message)
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAPIWithSession()
