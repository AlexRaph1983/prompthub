/**
 * Скрипт для тестирования консистентности просмотров
 * Проверяет, что все API endpoints возвращают одинаковые данные о просмотрах
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testViewsConsistency() {
  console.log('🧪 ТЕСТИРОВАНИЕ КОНСИСТЕНТНОСТИ ПРОСМОТРОВ\n')

  try {
    // 1. Получаем несколько промптов для тестирования
    const testPrompts = await prisma.prompt.findMany({
      take: 5,
      select: { id: true, title: true, views: true }
    })

    if (testPrompts.length === 0) {
      console.log('❌ Нет промптов для тестирования')
      return
    }

    console.log(`📋 Тестируем ${testPrompts.length} промптов:`)
    testPrompts.forEach((p, i) => {
      console.log(`${i + 1}. "${p.title.substring(0, 40)}..." (ID: ${p.id})`)
    })
    console.log()

    // 2. Тестируем каждый API endpoint
    for (const prompt of testPrompts) {
      console.log(`🔍 Тестируем промпт: "${prompt.title.substring(0, 40)}..."`)
      
      const results = {
        promptId: prompt.id,
        title: prompt.title,
        directField: prompt.views,
        apiDetails: null,
        apiList: null,
        apiAdmin: null,
        apiStats: null
      }

      try {
        // API деталей промпта
        const detailsResponse = await fetch(`http://localhost:3000/api/prompts/${prompt.id}`)
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          results.apiDetails = detailsData.views
        }
      } catch (error) {
        console.log(`  ❌ API details error: ${error.message}`)
      }

      try {
        // API списка промптов (поиск по ID)
        const listResponse = await fetch(`http://localhost:3000/api/prompts?q=${prompt.id}`)
        if (listResponse.ok) {
          const listData = await listResponse.json()
          const foundPrompt = listData.items?.find(p => p.id === prompt.id)
          results.apiList = foundPrompt?.views
        }
      } catch (error) {
        console.log(`  ❌ API list error: ${error.message}`)
      }

      try {
        // API админки
        const adminResponse = await fetch(`http://localhost:3000/api/admin/prompts?search=${prompt.id}`)
        if (adminResponse.ok) {
          const adminData = await adminResponse.json()
          const foundPrompt = adminData.prompts?.find(p => p.id === prompt.id)
          results.apiAdmin = foundPrompt?.views
        }
      } catch (error) {
        console.log(`  ❌ API admin error: ${error.message}`)
      }

      // Выводим результаты
      console.log(`  📊 Прямое поле: ${results.directField}`)
      console.log(`  📊 API Details: ${results.apiDetails}`)
      console.log(`  📊 API List: ${results.apiList}`)
      console.log(`  📊 API Admin: ${results.apiAdmin}`)

      // Проверяем консистентность
      const values = [results.directField, results.apiDetails, results.apiList, results.apiAdmin].filter(v => v !== null)
      const uniqueValues = [...new Set(values)]
      
      if (uniqueValues.length === 1) {
        console.log(`  ✅ КОНСИСТЕНТНО: все значения = ${uniqueValues[0]}`)
      } else {
        console.log(`  ❌ НЕКОНСИСТЕНТНО: разные значения: ${uniqueValues.join(', ')}`)
      }
      
      console.log()
    }

    // 3. Тестируем общую статистику
    console.log('📊 Тестируем общую статистику...')
    
    try {
      const statsResponse = await fetch('http://localhost:3000/api/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log(`  📊 API Stats views: ${statsData.views}`)
      }
    } catch (error) {
      console.log(`  ❌ API stats error: ${error.message}`)
    }

    try {
      const adminDashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard')
      if (adminDashboardResponse.ok) {
        const adminData = await adminDashboardResponse.json()
        console.log(`  📊 Admin Dashboard views: ${adminData.data?.views}`)
      }
    } catch (error) {
      console.log(`  ❌ Admin dashboard error: ${error.message}`)
    }

    console.log('\n✅ Тестирование завершено!')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testViewsConsistency().catch(console.error)
