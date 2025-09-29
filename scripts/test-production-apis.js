/**
 * Тест API endpoints на продакшене
 */

async function testProductionAPIs() {
  console.log('🧪 ТЕСТ API ENDPOINTS НА ПРОДАКШЕНЕ\n')

  const baseUrl = 'https://prompt-hub.site'
  const testPromptId = 'cmftyuu1v00539l6hapwra6su'

  try {
    // 1. Тестируем API деталей промпта
    console.log('🔍 Тестируем API деталей промпта...')
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        console.log(`  📊 API Details views: ${detailsData.views}`)
        console.log(`  📊 API Details title: ${detailsData.title}`)
      } else {
        console.log(`  ❌ API Details error: ${detailsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Details error: ${error.message}`)
    }

    // 2. Тестируем API списка промптов
    console.log('\n🔍 Тестируем API списка промптов...')
    try {
      const listResponse = await fetch(`${baseUrl}/api/prompts?limit=20`)
      if (listResponse.ok) {
        const listData = await listResponse.json()
        const foundPrompt = listData.items?.find(p => p.id === testPromptId)
        if (foundPrompt) {
          console.log(`  📊 API List views: ${foundPrompt.views}`)
          console.log(`  📊 API List title: ${foundPrompt.title}`)
        } else {
          console.log(`  ❌ Промпт не найден в списке`)
        }
      } else {
        console.log(`  ❌ API List error: ${listResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API List error: ${error.message}`)
    }

    // 3. Тестируем API рекомендаций
    console.log('\n🔍 Тестируем API рекомендаций...')
    try {
      const recommendationsResponse = await fetch(`${baseUrl}/api/recommendations`)
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json()
        const foundPrompt = recommendationsData.find(item => item.prompt?.id === testPromptId)
        if (foundPrompt) {
          console.log(`  📊 API Recommendations views: ${foundPrompt.prompt?.views}`)
          console.log(`  📊 API Recommendations title: ${foundPrompt.prompt?.title}`)
        } else {
          console.log(`  ❌ Промпт не найден в рекомендациях`)
        }
      } else {
        console.log(`  ❌ API Recommendations error: ${recommendationsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // 4. Тестируем API статистики
    console.log('\n🔍 Тестируем API статистики...')
    try {
      const statsResponse = await fetch(`${baseUrl}/api/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log(`  📊 API Stats views: ${statsData.views}`)
      } else {
        console.log(`  ❌ API Stats error: ${statsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Stats error: ${error.message}`)
    }

    console.log('\n✅ Тест API endpoints завершен!')

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  }
}

testProductionAPIs().catch(console.error)
