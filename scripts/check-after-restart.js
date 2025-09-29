/**
 * Проверка после перезапуска сервера
 */

async function checkAfterRestart() {
  console.log('🔍 ПРОВЕРКА ПОСЛЕ ПЕРЕЗАПУСКА СЕРВЕРА\n')

  const baseUrl = 'https://prompt-hub.site'

  try {
    // 1. Проверяем все API endpoints
    console.log('🔍 Проверяем все API endpoints...')
    
    const testPromptId = 'cmftyuu1v00539l6hapwra6su'
    const results = {}
    
    // API Health
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`)
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        console.log(`  ✅ API Health: ${JSON.stringify(healthData)}`)
      } else {
        console.log(`  ❌ API Health error: ${healthResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Health error: ${error.message}`)
    }

    // API Details
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        results.details = detailsData.views
        console.log(`  📊 API Details views: ${results.details}`)
      } else {
        console.log(`  ❌ API Details error: ${detailsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Details error: ${error.message}`)
    }

    // API Recommendations
    try {
      const recommendationsResponse = await fetch(`${baseUrl}/api/recommendations`)
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json()
        const foundPrompt = recommendationsData.find(item => item.prompt?.id === testPromptId)
        if (foundPrompt) {
          results.recommendations = foundPrompt.prompt?.views
          console.log(`  📊 API Recommendations views: ${results.recommendations}`)
        } else {
          console.log(`  ❌ Промпт не найден в рекомендациях`)
        }
      } else {
        console.log(`  ❌ API Recommendations error: ${recommendationsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // API Stats
    try {
      const statsResponse = await fetch(`${baseUrl}/api/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        results.stats = statsData.views
        console.log(`  📊 API Stats views: ${results.stats}`)
      } else {
        console.log(`  ❌ API Stats error: ${statsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Stats error: ${error.message}`)
    }

    // 2. Анализируем результаты
    console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТОВ:')
    console.log(`  📊 Details: ${results.details}`)
    console.log(`  📊 Recommendations: ${results.recommendations}`)
    console.log(`  📊 Stats: ${results.stats}`)

    // 3. Проверяем консистентность
    const values = Object.values(results).filter(v => v !== undefined)
    const uniqueValues = [...new Set(values)]
    
    console.log(`\n🔍 КОНСИСТЕНТНОСТЬ:`)
    console.log(`  📊 Уникальных значений: ${uniqueValues.length}`)
    console.log(`  📊 Значения: ${uniqueValues.join(', ')}`)
    
    if (uniqueValues.length === 1) {
      console.log(`  ✅ КОНСИСТЕНТНО: все API возвращают одинаковые значения!`)
      console.log(`  🎉 ПРОБЛЕМА РЕШЕНА!`)
    } else {
      console.log(`  ❌ НЕКОНСИСТЕНТНО: разные API возвращают разные значения!`)
      console.log(`  🔧 ПРОБЛЕМА: ViewsService работает по-разному в разных API!`)
    }

    // 4. Рекомендации
    console.log('\n🔧 РЕКОМЕНДАЦИИ:')
    if (uniqueValues.length === 1) {
      console.log('  ✅ Проблема решена! Все API консистентны.')
      console.log('  🎉 Сервер успешно перезапущен с новым кодом!')
    } else {
      console.log('  🔧 Нужно еще раз перезапустить сервер')
      console.log('  🔧 Возможно, деплой не сработал или есть кэширование')
      console.log('  🔧 Рекомендуется полный перезапуск сервера: sudo reboot')
    }

    console.log('\n✅ Проверка завершена!')

  } catch (error) {
    console.error('❌ Ошибка проверки:', error)
  }
}

checkAfterRestart().catch(console.error)
