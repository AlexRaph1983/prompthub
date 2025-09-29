/**
 * Принудительное обновление всех кэшей на продакшене
 */

async function forceCacheRefresh() {
  console.log('🔄 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ВСЕХ КЭШЕЙ\n')

  const baseUrl = 'https://prompt-hub.site'

  try {
    // 1. Обновляем все API endpoints
    console.log('🔄 Обновляем все API endpoints...')
    
    const endpoints = [
      '/api/stats?refresh=true',
      '/api/admin/dashboard',
      '/api/admin/simple-dashboard',
      '/api/prompts?limit=1',
      '/api/recommendations',
      '/api/admin/prompts'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`)
        if (response.ok) {
          console.log(`  ✅ ${endpoint} обновлен (${response.status})`)
        } else {
          console.log(`  ❌ ${endpoint} error: ${response.status}`)
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint} error: ${error.message}`)
      }
    }

    // 2. Ждем немного
    console.log('\n⏳ Ждем 10 секунд...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // 3. Проверяем конкретный промпт
    console.log('\n🔍 Проверяем конкретный промпт...')
    const testPromptId = 'cmftyuu1v00539l6hapwra6su'
    
    let detailsViews = 0
    let recommendationsViews = 0
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        detailsViews = detailsData.views
        console.log(`  📊 API Details views: ${detailsViews}`)
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
          recommendationsViews = foundPrompt.prompt?.views || 0
          console.log(`  📊 API Recommendations views: ${recommendationsViews}`)
        } else {
          console.log(`  ❌ Промпт не найден в рекомендациях`)
        }
      } else {
        console.log(`  ❌ API Recommendations error: ${recommendationsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // 4. Анализируем результат
    console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТА:')
    console.log(`  📊 Details: ${detailsViews}`)
    console.log(`  📊 Recommendations: ${recommendationsViews}`)
    
    if (detailsViews === recommendationsViews) {
      console.log(`  ✅ ПРОБЛЕМА РЕШЕНА: значения теперь совпадают!`)
    } else {
      console.log(`  ❌ ПРОБЛЕМА ВСЕ ЕЩЕ ЕСТЬ: ${detailsViews} ≠ ${recommendationsViews}`)
      console.log(`  🔧 РЕКОМЕНДАЦИЯ: Нужно вручную перезапустить сервер или проверить деплой`)
    }

    console.log('\n✅ Принудительное обновление кэшей завершено!')

  } catch (error) {
    console.error('❌ Ошибка обновления:', error)
  }
}

forceCacheRefresh().catch(console.error)
