// Скрипт для импорта промптов на продакшн сервер
const fs = require('fs');
const path = require('path');

// Читаем файл с промптами
const promptsFile = path.join(__dirname, '..', 'prompts_prompthub3.json');
const promptsData = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

// Преобразуем формат промптов
const transformedPrompts = promptsData.items.map((item) => ({
  title: item.title,
  description: item.summary,
  prompt: item.prompt_text,
  model: item.model,
  lang: item.language === 'ru' ? 'Русский' : item.language === 'en' ? 'English' : 'Multi',
  category: item.category,
  tags: item.tags,
  license: item.license,
  instructions: item.usage_instructions,
  example: item.examples ? item.examples.join('; ') : ''
}));

console.log('📋 Промпты для импорта на сервер:');
transformedPrompts.forEach((prompt, index) => {
  console.log(`${index + 1}. ${prompt.title}`);
});

console.log('\n🔧 Для импорта на сервер выполните:');
console.log('1. Подключитесь к серверу: ssh root@REDACTED_IP');
console.log('2. Перейдите в директорию: cd /root/prompthub');
console.log('3. Запустите скрипт импорта: npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json');
console.log('\n⚠️  ВНИМАНИЕ: Убедитесь, что файл prompts_prompthub3.json есть на сервере!');
