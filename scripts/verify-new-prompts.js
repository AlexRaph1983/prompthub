/**
 * Скрипт для проверки новых промптов из prompts_prompthub4.json
 */

const expectedPrompts = [
  "Чек-лист для выгорающего сотрудника: быстрые шаги восстановления",
  "Как повысить концентрацию за 15 минут", 
  "Мини-бюджет: как дожить до зарплаты",
  "Упрощённый чек-лист запуска фриланс-карьеры",
  "Скрипт звонка для переговоров о повышении зарплаты",
  "Генерация идей для сторис Instagram",
  "Идеальный план утренней рутины",
  "Гайд по ChatGPT для новичков",
  "Как не прокрастинировать: план на день",
  "План запуска Telegram-канала с нуля"
];

async function checkPrompts() {
  try {
    console.log('🔍 Проверяем новые промпты из prompts_prompthub4.json...\n');
    
    const response = await fetch('http://localhost:3000/api/prompts?limit=20');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    console.log(`📊 Всего промптов получено: ${data.items.length}`);
    console.log(`📄 Есть еще промпты: ${data.hasMore ? 'Да' : 'Нет'}\n`);
    
    const foundPrompts = [];
    const missingPrompts = [];
    
    expectedPrompts.forEach(expectedTitle => {
      const found = data.items.find(item => item.title === expectedTitle);
      if (found) {
        foundPrompts.push({
          title: found.title,
          id: found.id,
          author: found.author,
          category: found.category,
          model: found.model,
          tags: found.tags
        });
      } else {
        missingPrompts.push(expectedTitle);
      }
    });
    
    console.log('✅ НАЙДЕННЫЕ ПРОМПТЫ:');
    foundPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. "${prompt.title}"`);
      console.log(`   ID: ${prompt.id}`);
      console.log(`   Категория: ${prompt.category} | Модель: ${prompt.model}`);
      console.log(`   Теги: ${prompt.tags.join(', ')}\n`);
    });
    
    if (missingPrompts.length > 0) {
      console.log('❌ НЕ НАЙДЕННЫЕ ПРОМПТЫ:');
      missingPrompts.forEach((title, index) => {
        console.log(`${index + 1}. "${title}"`);
      });
      console.log('');
    }
    
    console.log(`🎯 РЕЗУЛЬТАТ: ${foundPrompts.length}/${expectedPrompts.length} промптов найдено`);
    
    if (foundPrompts.length === expectedPrompts.length) {
      console.log('🎉 ВСЕ ПРОМПТЫ УСПЕШНО ДОБАВЛЕНЫ И ОТОБРАЖАЮТСЯ!');
    } else {
      console.log('⚠️  Не все промпты найдены. Проверьте импорт.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке промптов:', error.message);
    console.log('\n💡 Убедитесь что:');
    console.log('1. Локальный сервер запущен (npm run dev)');
    console.log('2. API доступно по адресу http://localhost:3000/api/prompts');
    console.log('3. Импорт промптов прошел успешно');
  }
}

checkPrompts();
