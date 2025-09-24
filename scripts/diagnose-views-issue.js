/**
 * Диагностика проблемы с обнулением просмотров
 */

async function diagnoseViewsIssue() {
  try {
    console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМЫ С ПРОСМОТРАМИ\n')
    
    // 1. Проверяем API промптов PromptMaster
    console.log('1️⃣ Проверяем промпты PromptMaster через API...')
    const response = await fetch('http://localhost:3000/api/prompts?authorId=promptmaster&limit=10')
    const data = await response.json()
    
    if (!data.items) {
      console.error('❌ Нет данных от API')
      return
    }
    
    console.log(`📊 Найдено промптов: ${data.items.length}`)
    
    const zeroViews = data.items.filter(p => p.views === 0)
    const nonZeroViews = data.items.filter(p => p.views > 0)
    
    console.log(`🔴 С нулевыми просмотрами: ${zeroViews.length}`)
    console.log(`🟢 С ненулевыми просмотрами: ${nonZeroViews.length}`)
    
    console.log('\n📋 ДЕТАЛИ ПРОМПТОВ:')
    data.items.slice(0, 8).forEach((p, i) => {
      console.log(`${i + 1}. "${p.title.substring(0, 45)}..." - ${p.views} просмотров (${p.id})`)
    })
    
    // 2. Тестируем добавление просмотра
    if (data.items.length > 0) {
      const testPrompt = data.items[0]
      console.log(`\n2️⃣ Тестируем добавление просмотра для: "${testPrompt.title.substring(0, 30)}..."`)
      
      // Получаем токен
      const tokenResponse = await fetch('http://localhost:3000/api/view-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: testPrompt.id,
          fingerprint: 'test-' + Date.now()
        })
      })
      
      const tokenData = await tokenResponse.json()
      if (tokenData.viewToken) {
        console.log(`✅ Токен получен: ${tokenData.viewToken.substring(0, 20)}...`)
        
        // Отправляем просмотр
        const trackResponse = await fetch('http://localhost:3000/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: testPrompt.id,
            viewToken: tokenData.viewToken
          })
        })
        
        const trackData = await trackResponse.json()
        console.log(`📈 Результат track-view:`, trackData)
        
        // Проверяем обновленные данные через 2 секунды
        console.log('\n⏳ Ждем 2 секунды и проверяем обновления...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const updatedResponse = await fetch(`http://localhost:3000/api/prompts?authorId=promptmaster&limit=10`)
        const updatedData = await updatedResponse.json()
        const updatedPrompt = updatedData.items.find(p => p.id === testPrompt.id)
        
        if (updatedPrompt) {
          console.log(`📊 Просмотры ДО: ${testPrompt.views}`)
          console.log(`📊 Просмотры ПОСЛЕ: ${updatedPrompt.views}`)
          console.log(`📈 Изменение: ${updatedPrompt.views - testPrompt.views}`)
          
          if (updatedPrompt.views > testPrompt.views) {
            console.log('✅ Система работает - просмотры увеличились!')
          } else {
            console.log('❌ ПРОБЛЕМА: Просмотры не увеличились!')
          }
        }
      } else {
        console.error('❌ Не удалось получить токен:', tokenData)
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error.message)
  }
}

diagnoseViewsIssue()
