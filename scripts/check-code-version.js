/**
 * Проверка версии кода на продакшене
 */

async function checkCodeVersion() {
  console.log('🔍 ПРОВЕРКА ВЕРСИИ КОДА НА ПРОДАКШЕНЕ\n')

  const baseUrl = 'https://prompt-hub.site'

  try {
    // 1. Проверяем, есть ли новые изменения
    console.log('🔍 Проверяем изменения в коде...')
    
    // Проверяем, есть ли новые файлы
    try {
      const testResponse = await fetch(`${baseUrl}/api/health`)
      if (testResponse.ok) {
        const testData = await testResponse.json()
        console.log(`  📊 Health API: ${JSON.stringify(testData)}`)
      }
    } catch (error) {
      console.log(`  ❌ Health API error: ${error.message}`)
    }

    // 2. Проверяем конкретный промпт с детальной отладкой
    console.log('\n🔍 Детальная отладка промпта...')
    const testPromptId = 'cmftyuu1v00539l6hapwra6su'
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        console.log(`  📊 API Details views: ${detailsData.views}`)
        console.log(`  📊 API Details title: ${detailsData.title}`)
        console.log(`  📊 API Details author: ${detailsData.author}`)
        console.log(`  📊 API Details rating: ${detailsData.rating}`)
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
          console.log(`  📊 API Recommendations author: ${foundPrompt.prompt?.author?.name}`)
          console.log(`  📊 API Recommendations rating: ${foundPrompt.prompt?.averageRating}`)
        } else {
          console.log(`  ❌ Промпт не найден в рекомендациях`)
        }
      } else {
        console.log(`  ❌ API Recommendations error: ${recommendationsResponse.status}`)
      }
    } catch (error) {
      console.log(`  ❌ API Recommendations error: ${error.message}`)
    }

    // 3. Проверяем, есть ли различия в данных
    console.log('\n🔍 Анализируем различия...')
    
    try {
      const detailsResponse = await fetch(`${baseUrl}/api/prompts/${testPromptId}`)
      const recommendationsResponse = await fetch(`${baseUrl}/api/recommendations`)
      
      if (detailsResponse.ok && recommendationsResponse.ok) {
        const detailsData = await detailsResponse.json()
        const recommendationsData = await recommendationsResponse.json()
        const foundPrompt = recommendationsData.find(item => item.prompt?.id === testPromptId)
        
        if (foundPrompt) {
          const detailsViews = detailsData.views
          const recommendationsViews = foundPrompt.prompt?.views
          
          console.log(`  📊 Details views: ${detailsViews}`)
          console.log(`  📊 Recommendations views: ${recommendationsViews}`)
          console.log(`  📊 Разница: ${Math.abs(detailsViews - recommendationsViews)}`)
          
          if (detailsViews === recommendationsViews) {
            console.log(`  ✅ КОНСИСТЕНТНО: значения совпадают!`)
          } else {
            console.log(`  ❌ НЕКОНСИСТЕНТНО: ${detailsViews} ≠ ${recommendationsViews}`)
            console.log(`  🔧 ПРОБЛЕМА: ViewsService работает по-разному для одного и множества промптов!`)
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Ошибка анализа: ${error.message}`)
    }

    console.log('\n✅ Проверка версии кода завершена!')

  } catch (error) {
    console.error('❌ Ошибка проверки:', error)
  }
}

checkCodeVersion().catch(console.error)
