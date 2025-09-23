const fs = require('fs');
const path = require('path');

// Читаем файл с промптами
const promptsFile = path.join(__dirname, '..', 'prompts_prompthub3.json');
const promptsData = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

// Преобразуем формат промптов из JSON в формат, ожидаемый API
const transformedPrompts = promptsData.items.map((item, index) => ({
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

console.log(`Найдено ${transformedPrompts.length} промптов для импорта:`);
transformedPrompts.forEach((prompt, index) => {
  console.log(`${index + 1}. ${prompt.title} (${prompt.model})`);
});

// Сохраняем преобразованные промпты в файл для импорта
const outputFile = path.join(__dirname, '..', 'prompts_for_import.json');
fs.writeFileSync(outputFile, JSON.stringify(transformedPrompts, null, 2));

console.log(`\nПромпты сохранены в файл: ${outputFile}`);
console.log('Для импорта выполните POST запрос на /api/prompts/bulk с телом:');
console.log(`{ "prompts": ${JSON.stringify(transformedPrompts)} }`);
