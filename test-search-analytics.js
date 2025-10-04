// Тест поисковой аналитики
const testSearchAnalytics = async () => {
  console.log('🔍 Тестируем поисковую аналитику...')
  
  try {
    // Тест 1: Поиск через API
    console.log('1. Тестируем API поиск...')
    const apiResponse = await fetch('http://localhost:3000/api/prompts?q=music')
    const apiData = await apiResponse.json()
    console.log('API результат:', apiData.items.length, 'промптов')
    
    // Тест 2: Отправка аналитики напрямую
    console.log('2. Тестируем отправку аналитики...')
    const analyticsResponse = await fetch('http://localhost:3000/api/search-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test-music-search',
        resultsCount: 2,
        sessionId: 'test-session-123',
        finished: true
      })
    })
    
    const analyticsData = await analyticsResponse.json()
    console.log('Аналитика результат:', analyticsData)
    
    // Тест 3: Проверка админ панели
    console.log('3. Проверяем админ панель...')
    const adminResponse = await fetch('http://localhost:3000/api/admin/simple-dashboard')
    const adminData = await adminResponse.json()
    console.log('Админ данные:', adminData)
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  }
}

testSearchAnalytics()
