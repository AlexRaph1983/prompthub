/**
 * Проверка статуса деплоя на продакшене
 */

async function checkDeploymentStatus() {
  console.log('🔍 ПРОВЕРКА СТАТУСА ДЕПЛОЯ\n')

  const baseUrl = 'https://prompt-hub.site'

  try {
    // 1. Проверяем версию API
    console.log('🔍 Проверяем версию API...')
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`)
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        console.log(`  📊 Health API: ${JSON.stringify(healthData)}`)
      } else {
        console.log(`  ❌ Health API error: ${healthResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ Health API error: ${error.message}`)
    }

    // 2. Проверяем время последнего обновления
    console.log('\n🔍 Проверяем время последнего обновления...')
    try {
      const statsResponse = await fetch(`${baseUrl}/api/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log(`  📊 Stats timestamp: ${statsData.timestamp}`)
        console.log(`  📊 Stats cached: ${statsData.cached}`)
        if (statsData.cacheAge) {
          console.log(`  📊 Cache age: ${statsData.cacheAge} seconds`)
        }
      } else {
        console.log(`  ❌ Stats API error: ${statsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ Stats API error: ${error.message}`)
    }

    // 3. Проверяем конкретный промпт еще раз
    console.log('\n🔍 Проверяем конкретный промпт...')
    const testPromptId = 'cmftyuu1v00539l6hapwra6su'
    
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

    console.log('\n✅ Проверка статуса деплоя завершена!')

  } catch (error) {
    console.error('❌ Ошибка проверки:', error)
  }
}

checkDeploymentStatus().catch(console.error)
