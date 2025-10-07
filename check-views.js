const https = require('https');

async function checkViews() {
  console.log('🔍 ПРОВЕРКА ПРОСМОТРОВ НА ПРОДАКШЕНЕ');
  console.log('==================================');
  
  const testPromptId = 'cmftyuu1v00539l6hapwra6su';
  
  try {
    // Проверяем API Details
    const detailsResponse = await fetch(`https://prompt-hub.site/api/prompts/${testPromptId}`);
    const detailsData = await detailsResponse.json();
    const detailsViews = detailsData.views;
    console.log(`📊 API Details views: ${detailsViews}`);
    
    // Проверяем API Recommendations
    const recommendationsResponse = await fetch('https://prompt-hub.site/api/recommendations');
    const recommendationsData = await recommendationsResponse.json();
    const foundPrompt = recommendationsData.find(item => item.prompt?.id === testPromptId);
    const recommendationsViews = foundPrompt?.prompt?.views || 0;
    console.log(`📊 API Recommendations views: ${recommendationsViews}`);
    
    // Анализируем результат
    console.log('\n📊 АНАЛИЗ:');
    if (detailsViews === recommendationsViews) {
      console.log(`✅ ПРОБЛЕМА РЕШЕНА! Значения совпадают: ${detailsViews}`);
    } else {
      console.log(`❌ ПРОБЛЕМА ВСЕ ЕЩЕ ЕСТЬ: ${detailsViews} ≠ ${recommendationsViews}`);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkViews();
