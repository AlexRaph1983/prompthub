const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateQuality() {
  console.log('🔍 ВАЛИДАЦИЯ КАЧЕСТВА ДОБАВЛЕННЫХ ПРОМПТОВ:\n');

  // Получаем последние 300 промптов
  const recentPrompts = await prisma.prompt.findMany({
    take: 300,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true } },
      categoryRef: { select: { nameRu: true } }
    }
  });

  console.log(`Проверяем ${recentPrompts.length} последних промптов\n`);

  // Статистика по категориям
  const categoryStats = {};
  const modelStats = {};
  let totalLength = 0;
  let validCount = 0;

  recentPrompts.forEach(prompt => {
    const category = prompt.categoryRef?.nameRu || prompt.category;
    const model = prompt.model;

    categoryStats[category] = (categoryStats[category] || 0) + 1;
    modelStats[model] = (modelStats[model] || 0) + 1;

    const promptLength = prompt.prompt.length;
    totalLength += promptLength;

    // Проверки качества
    const hasProperLength = promptLength >= 500 && promptLength <= 1000;
    const hasRussianText = /[\u0400-\u04FF]/.test(prompt.prompt); // Проверка на кириллицу
    const hasStructure = prompt.prompt.includes('ФИНАЛЬНЫЙ РЕЗУЛЬТАТ') || prompt.prompt.includes('СТРУКТУРА');
    const notTemplate = !prompt.title.includes('{') && !prompt.prompt.includes('{');

    if (hasProperLength && hasRussianText && hasStructure && notTemplate) {
      validCount++;
    }
  });

  console.log('📂 РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ:');
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} промптов`);
  });

  console.log('\n🤖 РАСПРЕДЕЛЕНИЕ ПО МОДЕЛЯМ:');
  Object.entries(modelStats).forEach(([model, count]) => {
    console.log(`${model}: ${count} промптов`);
  });

  const avgLength = Math.round(totalLength / recentPrompts.length);
  const qualityPercent = Math.round((validCount / recentPrompts.length) * 100);

  console.log(`\n📊 КАЧЕСТВЕННЫЕ МЕТРИКИ:`);
  console.log(`Средняя длина промпта: ${avgLength} символов`);
  console.log(`Процент качественных промптов: ${qualityPercent}%`);
  console.log(`Всего промптов соответствует требованиям: ${validCount}/${recentPrompts.length}`);

  console.log('\n📋 ПРИМЕРЫ ПРОМПТОВ:');
  const samples = recentPrompts.slice(0, 3);
  samples.forEach((p, i) => {
    console.log(`${i + 1}. "${p.title}"`);
    console.log(`   Категория: ${p.categoryRef?.nameRu || p.category}`);
    console.log(`   Модель: ${p.model}`);
    console.log(`   Длина: ${p.prompt.length} символов`);
    console.log(`   Фрагмент: ${p.prompt.substring(0, 100)}...`);
    console.log('');
  });

  await prisma.$disconnect();
}

validateQuality().catch(console.error);
