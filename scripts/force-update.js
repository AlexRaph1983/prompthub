/**
 * Принудительное обновление кода на продакшене
 */

async function forceUpdate() {
  console.log('🔄 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ КОДА\n')

  const baseUrl = 'https://prompt-hub.site'

  try {
    // 1. Проверяем текущий статус
    console.log('🔍 Проверяем текущий статус...')
    const testPromptId = 'cmftyuu1v00539l6hapwra6su'
    
    let detailsViews = 0
    let recommendationsViews = 0
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        detailsViews = detailsData.views
        console.log(`  📊 API Details views: ${detailsViews}`)
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
        }
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // 2. Пытаемся принудительно обновить все кэши
    console.log('\n🔄 Принудительно обновляем все кэши...')
    
    // Обновляем все API endpoints
    const endpoints = [
      '/api/stats?refresh=true',
      '/api/admin/dashboard',
      '/api/admin/simple-dashboard',
      '/api/prompts?limit=1',
      '/api/recommendations'
    ]
    
    for (const endpoint of endpoints) {
      try {
        await fetch(`${baseUrl}${endpoint}`)
        console.log(`  ✅ ${endpoint} обновлен`)
      } catch (error) {
        console.log(`  ❌ ${endpoint} error: ${error.message}`)
      }
    }

    // 3. Ждем немного
    console.log('\n⏳ Ждем 5 секунд...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 4. Проверяем результат
    console.log('\n🔍 Проверяем результат...')
    
    let newDetailsViews = 0
    let newRecommendationsViews = 0
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        newDetailsViews = detailsData.views
        console.log(`  📊 API Details views: ${newDetailsViews}`)
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
          newRecommendationsViews = foundPrompt.prompt?.views || 0
          console.log(`  📊 API Recommendations views: ${newRecommendationsViews}`)
        }
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // 5. Анализируем результат
    console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТА:')
    console.log(`  📊 Details: ${detailsViews} → ${newDetailsViews}`)
    console.log(`  📊 Recommendations: ${recommendationsViews} → ${newRecommendationsViews}`)
    
    if (newDetailsViews === newRecommendationsViews) {
      console.log(`  ✅ ПРОБЛЕМА РЕШЕНА: значения теперь совпадают!`)
    } else {
      console.log(`  ❌ ПРОБЛЕМА ВСЕ ЕЩЕ ЕСТЬ: ${newDetailsViews} ≠ ${newRecommendationsViews}`)
      console.log(`  🔧 РЕКОМЕНДАЦИЯ: Нужно вручную перезапустить сервер или проверить деплой`)
    }

    console.log('\n✅ Принудительное обновление завершено!')

  } catch (error) {
    console.error('❌ Ошибка обновления:', error)
  }
}

forceUpdate().catch(console.error)
