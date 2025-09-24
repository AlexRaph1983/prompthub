/**
 * Тестирование системы просмотров
 */

async function testViewsSystem() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Тестируем систему просмотров...\n')
  
  // 1. Получаем список промптов
  console.log('1. Получаем список промптов...')
  const promptsResponse = await fetch(`${baseUrl}/api/prompts?limit=3`)
  const promptsData = await promptsResponse.json()
  
  if (!promptsData.items || promptsData.items.length === 0) {
    console.error('❌ Нет промптов для тестирования')
    return
  }
  
  const testPrompt = promptsData.items[0]
  console.log(`✅ Выбран промпт для теста: "${testPrompt.title}"`)
  console.log(`📊 Текущие просмотры: ${testPrompt.views}`)
  
  // 2. Получаем токен просмотра
  console.log('\n2. Получаем токен просмотра...')
  const tokenResponse = await fetch(`${baseUrl}/api/view-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      cardId: testPrompt.id,
      fingerprint: 'test-fingerprint-' + Date.now()
    })
  })
  
  const tokenData = await tokenResponse.json()
  if (!tokenData.viewToken) {
    console.error('❌ Не удалось получить токен просмотра:', tokenData)
    return
  }
  
  console.log(`✅ Получен токен: ${tokenData.viewToken.substring(0, 20)}...`)
  
  // 3. Отправляем просмотр
  console.log('\n3. Отправляем просмотр...')
  const trackResponse = await fetch(`${baseUrl}/api/track-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardId: testPrompt.id,
      viewToken: tokenData.viewToken
    })
  })
  
  const trackData = await trackResponse.json()
  console.log(`✅ Результат отслеживания:`, trackData)
  
  // 4. Проверяем обновленные просмотры
  console.log('\n4. Проверяем обновленные просмотры...')
  await new Promise(resolve => setTimeout(resolve, 1000)) // Ждем 1 секунду
  
  const updatedResponse = await fetch(`${baseUrl}/api/prompts?limit=10`)
  const updatedData = await updatedResponse.json()
  const updatedPrompt = updatedData.items.find(p => p.id === testPrompt.id)
  
  if (updatedPrompt) {
    console.log(`📊 Просмотры до: ${testPrompt.views}`)
    console.log(`📊 Просмотры после: ${updatedPrompt.views}`)
    console.log(`📈 Изменение: ${updatedPrompt.views - testPrompt.views}`)
    
    if (updatedPrompt.views > testPrompt.views) {
      console.log('✅ Система просмотров работает корректно!')
    } else {
      console.log('⚠️ Просмотры не увеличились - возможна проблема')
    }
  } else {
    console.log('❌ Не найден промпт после обновления')
  }
  
  console.log('\n🎯 Тестирование завершено!')
}

testViewsSystem().catch(console.error)
