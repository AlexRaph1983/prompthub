/**
 * Тестирование новой системы просмотров с интеграцией
 */

async function testNewViewsSystem() {
  try {
    console.log('🧪 ТЕСТИРОВАНИЕ НОВОЙ СИСТЕМЫ ПРОСМОТРОВ\n')
    
    // 1. Проверяем состояние до теста
    console.log('1️⃣ Получаем исходное состояние...')
    const initialResponse = await fetch('http://localhost:3000/api/prompts?authorId=promptmaster&limit=5')
    const initialData = await initialResponse.json()
    
    if (!initialData.items || initialData.items.length === 0) {
      console.error('❌ Нет промптов для тестирования')
      return
    }
    
    const testPrompt = initialData.items[0]
    console.log(`✅ Тестовый промпт: "${testPrompt.title.substring(0, 40)}..."`)
    console.log(`📊 Исходные просмотры: ${testPrompt.views}`)
    console.log(`⭐ Рейтинг: ${testPrompt.rating} (${testPrompt.ratingCount} оценок)`)
    
    // 2. Добавляем несколько просмотров
    console.log('\n2️⃣ Добавляем 3 просмотра...')
    
    for (let i = 1; i <= 3; i++) {
      // Получаем токен
      const tokenResponse = await fetch('http://localhost:3000/api/view-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: testPrompt.id,
          fingerprint: `test-${Date.now()}-${i}`
        })
      })
      
      const tokenData = await tokenResponse.json()
      if (!tokenData.viewToken) {
        console.error(`❌ Не удалось получить токен для просмотра ${i}`)
        continue
      }
      
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
      console.log(`📈 Просмотр ${i}: ${trackData.counted ? '✅ засчитан' : '❌ не засчитан'} (всего: ${trackData.views})`)
      
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // 3. Проверяем обновленное состояние
    console.log('\n3️⃣ Проверяем обновленное состояние...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Ждем обновления
    
    const updatedResponse = await fetch('http://localhost:3000/api/prompts?authorId=promptmaster&limit=5')
    const updatedData = await updatedResponse.json()
    const updatedPrompt = updatedData.items.find(p => p.id === testPrompt.id)
    
    if (updatedPrompt) {
      console.log(`📊 Просмотры ДО: ${testPrompt.views}`)
      console.log(`📊 Просмотры ПОСЛЕ: ${updatedPrompt.views}`)
      console.log(`📈 Прирост: ${updatedPrompt.views - testPrompt.views}`)
      
      if (updatedPrompt.views > testPrompt.views) {
        console.log('✅ УСПЕХ: Новая система просмотров работает!')
      } else {
        console.log('❌ ПРОБЛЕМА: Просмотры не увеличились в API!')
      }
    } else {
      console.log('❌ Не найден обновленный промпт')
    }
    
    // 4. Проверяем все промпты PromptMaster
    console.log('\n4️⃣ Проверяем все промпты PromptMaster...')
    const allPrompts = updatedData.items
    const withViews = allPrompts.filter(p => p.views > 0)
    const withoutViews = allPrompts.filter(p => p.views === 0)
    
    console.log(`🟢 Промптов с просмотрами: ${withViews.length}`)
    console.log(`🔴 Промптов без просмотров: ${withoutViews.length}`)
    
    if (withViews.length > 0) {
      console.log('\n📊 ТОП ПРОСМАТРИВАЕМЫЕ:')
      withViews
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .forEach((p, i) => {
          console.log(`${i + 1}. "${p.title.substring(0, 40)}..." - ${p.views} просмотров`)
        })
    }
    
    // 5. Итоговая оценка
    console.log('\n🎯 ИТОГОВАЯ ОЦЕНКА:')
    const totalViews = allPrompts.reduce((sum, p) => sum + p.views, 0)
    console.log(`📊 Общее количество просмотров: ${totalViews}`)
    console.log(`📈 Средние просмотры на промпт: ${(totalViews / allPrompts.length).toFixed(1)}`)
    
    if (withViews.length >= allPrompts.length * 0.5) {
      console.log('✅ СИСТЕМА РАБОТАЕТ ОТЛИЧНО: Большинство промптов имеют просмотры!')
    } else if (withViews.length > 0) {
      console.log('⚠️ СИСТЕМА РАБОТАЕТ ЧАСТИЧНО: Некоторые промпты имеют просмотры')
    } else {
      console.log('❌ СИСТЕМА НЕ РАБОТАЕТ: Нет промптов с просмотрами')
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message)
  }
}

testNewViewsSystem()
