const fs = require('fs');

function checkPromptsFile(filename) {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    const jsonData = JSON.parse(data);
    
    if (jsonData.items && Array.isArray(jsonData.items)) {
      console.log(`${filename}: ${jsonData.items.length} промптов`);
      return jsonData.items.length;
    } else if (Array.isArray(jsonData)) {
      console.log(`${filename}: ${jsonData.length} промптов`);
      return jsonData.length;
    } else {
      console.log(`${filename}: Неизвестный формат`);
      return 0;
    }
  } catch (error) {
    console.log(`${filename}: Ошибка чтения - ${error.message}`);
    return 0;
  }
}

console.log('Проверяем все файлы с промптами...\n');

const files = [
  'prompts_prompthub2.json',
  'prompts_prompthub3.json', 
  'prompts_prompthub4.json',
  'suno_prompts.json',
  'data-export.json',
  'new_prompts_batch.json'
];

let totalPrompts = 0;

files.forEach(file => {
  const count = checkPromptsFile(file);
  totalPrompts += count;
});

console.log(`\nВсего промптов во всех файлах: ${totalPrompts}`);
