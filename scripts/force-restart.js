/**
 * Принудительный перезапуск сервера
 */

async function forceRestart() {
  console.log('🔄 ПРИНУДИТЕЛЬНЫЙ ПЕРЕЗАПУСК СЕРВЕРА\n')

  const baseUrl = 'https://prompt-hub.site'

  try {
    // 1. Проверяем текущий статус
    console.log('🔍 Проверяем текущий статус...')
    const testPromptId = 'cmftyuu1v00539l6hapwra6su'
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        console.log(`  📊 API Details views: ${detailsData.views}`)
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
        }
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // 2. Пытаемся принудительно обновить кэш
    console.log('\n🔄 Принудительно обновляем кэш...')
    
    // Обновляем stats
    try {
      await fetch(`${baseUrl}/api/stats?refresh=true`)
      console.log('  ✅ Stats cache обновлен')
    } catch (error) {
      console.log(`  ❌ Stats cache error: ${error.message}`)
    }

    // Обновляем admin dashboard
    try {
      await fetch(`${baseUrl}/api/admin/dashboard`)
      console.log('  ✅ Admin dashboard обновлен')
    } catch (error) {
      console.log(`  ❌ Admin dashboard error: ${error.message}`)
    }

    // 3. Проверяем результат
    console.log('\n🔍 Проверяем результат...')
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        console.log(`  📊 API Details views: ${detailsData.views}`)
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
        }
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    console.log('\n✅ Принудительный перезапуск завершен!')

  } catch (error) {
    console.error('❌ Ошибка перезапуска:', error)
  }
}

forceRestart().catch(console.error)
