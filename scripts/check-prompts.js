const fs = require('fs');
const path = require('path');

// Читаем демо-промпты
const demoPromptsFile = path.join(__dirname, '..', 'data', 'demoPrompts.ts');
const content = fs.readFileSync(demoPromptsFile, 'utf8');

// Подсчитываем количество промптов
const promptMatches = content.match(/id: '\d+'/g);
const promptCount = promptMatches ? promptMatches.length : 0;

console.log(`✅ Найдено ${promptCount} промптов в demoPrompts.ts`);

// Проверяем, что новые промпты добавлены
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
newPrompts.forEach(prompt => {
  if (content.includes(prompt)) {
    console.log(`✅ ${prompt}`);
    foundCount++;
  } else {
    console.log(`❌ ${prompt}`);
  }
});

console.log(`\n📊 Результат: ${foundCount}/${newPrompts.length} новых промптов найдено`);

if (foundCount === newPrompts.length) {
  console.log('🎉 Все новые промпты успешно добавлены!');
} else {
  console.log('⚠️  Некоторые промпты не найдены. Проверьте файл demoPrompts.ts');
}
