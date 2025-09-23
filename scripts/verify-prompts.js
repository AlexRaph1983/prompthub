// Используем встроенный fetch в Node.js

async function verifyPrompts() {
  try {
    console.log('🔍 Проверяем отображение новых промптов на сайте...\n');
    
    // Получаем промпты с API
    const response = await fetch('http://localhost:3000/api/prompts?limit=20&sort=createdAt&order=desc');
    const data = await response.json();
    
    if (!data.items) {
      console.log('❌ Ошибка: API не вернул промпты');
      return;
    }
    
    console.log(`📊 Всего промптов в базе: ${data.items.length}`);
    
    // Ищем наши новые промпты
    const newPrompts = [
      'План питания на неделю',
      'Домашняя тренировка без оборудования',
      'Личный бюджет по правилу 50-30-20',
      'План уик-энд поездки',
      'Буллет-пойнты резюме',
      'Вежливое и краткое деловое письмо',
      'Идеи подарков по интересам',
      'Учебный план на месяц',
      'Что приготовить из того, что есть',
      'Уборка квартиры за 60 минут'
    ];
    
    console.log('\n🔍 Проверяем наличие новых промптов:');
    let foundCount = 0;
    
    newPrompts.forEach(expectedTitle => {
      const found = data.items.find(prompt => 
        prompt.title.includes(expectedTitle) || expectedTitle.includes(prompt.title)
      );
      
      if (found) {
        console.log(`✅ ${found.title}`);
        console.log(`   Модель: ${found.model}, Категория: ${found.category}`);
        foundCount++;
      } else {
        console.log(`❌ ${expectedTitle} - НЕ НАЙДЕН`);
      }
    });
    
    console.log(`\n📊 Результат: ${foundCount}/${newPrompts.length} новых промптов найдено`);
    
    if (foundCount === newPrompts.length) {
      console.log('🎉 Все новые промпты успешно добавлены и отображаются!');
      console.log('\n🌐 Откройте http://localhost:3000 в браузере, чтобы увидеть промпты на сайте');
    } else {
      console.log('⚠️  Некоторые промпты не найдены. Проверьте импорт.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
    console.log('Убедитесь, что сервер разработки запущен на http://localhost:3000');
  }
}

verifyPrompts();
