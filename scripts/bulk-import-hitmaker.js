const fs = require('fs');
const path = require('path');

async function importPrompts() {
  try {
    // Читаем преобразованные промпты
    const promptsFile = path.join(__dirname, '..', 'hitmaker_prompts_for_import.json');
    const prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

    console.log(`Импортируем ${prompts.length} промптов...`);

    // Делаем POST запрос к API
    const response = await fetch('http://localhost:3000/api/prompts/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Для тестирования используем фиктивный session cookie
        // В реальности нужно будет авторизоваться
        'Cookie': 'next-auth.session-token=test-session-token'
      },
      body: JSON.stringify({ prompts })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Импорт успешен:', result);

  } catch (error) {
    console.error('Ошибка импорта:', error.message);
  }
}

importPrompts();
