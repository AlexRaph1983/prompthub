const fs = require('fs');
const path = require('path');

// Читаем преобразованные промпты
const promptsFile = path.join(__dirname, '..', 'prompts_for_import.json');
const prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

async function importPrompts() {
  try {
    console.log('Начинаем импорт промптов...');
    
    const response = await fetch('http://localhost:3000/api/prompts/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompts })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Импорт успешно завершен!');
      console.log(`Импортировано промптов: ${result.count}`);
      console.log('Результат:', result);
    } else {
      const error = await response.text();
      console.error('❌ Ошибка при импорте:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Ошибка сети:', error.message);
    console.log('Убедитесь, что сервер разработки запущен на http://localhost:3000');
  }
}

importPrompts();
