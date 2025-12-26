const { PrismaClient } = require('@prisma/client');
const CONTENT_STRATEGY = require('./content-strategy.js');

const prisma = new PrismaClient();

// Промпты уже должны быть сгенерированы в памяти или сохранены в файл
// Для простоты создадим простой скрипт, который проверит и сохранит недостающие

async function saveMissingPrompts() {
  console.log('🔍 Проверяем и сохраняем недостающие промпты...\n');

  // Получить текущие количества по категориям
  const currentCounts = await prisma.prompt.groupBy({
    by: ['category'],
    _count: { id: true }
  });

  const currentCountMap = {};
  currentCounts.forEach(item => {
    currentCountMap[item.category] = item._count.id;
  });

  console.log('Текущие количества промптов по категориям:');
  Object.entries(CONTENT_STRATEGY.categories).forEach(([category, target]) => {
    const current = currentCountMap[category] || 0;
    const needed = Math.max(0, target - current);
    console.log(`${category}: ${current}/${target} (${needed > 0 ? `${needed} нужно добавить` : 'достаточно'})`);
  });

  // Для каждой категории, где не хватает промптов, создадим простые шаблонные промпты
  let totalAdded = 0;

  for (const [category, target] of Object.entries(CONTENT_STRATEGY.categories)) {
    if (category === 'nsfw') continue; // Пропускаем NSFW

    const current = currentCountMap[category] || 0;
    const needed = Math.max(0, target - current);

    if (needed > 0) {
      console.log(`\n📝 Добавляем ${needed} промптов в категорию ${category}`);

      // Получить ID категории
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category }
      });

      if (!categoryRecord) {
        console.log(`❌ Категория ${category} не найдена`);
        continue;
      }

      // Получить случайного автора
      const authors = await prisma.user.findMany({
        where: {
          prompts: { some: {} },
          NOT: { email: { contains: 'promptmaster' } }
        },
        select: { id: true },
        take: 5
      });

      const authorId = authors.length > 0
        ? authors[Math.floor(Math.random() * authors.length)].id
        : (await prisma.user.findFirst({ select: { id: true } }))?.id;

      // Создать простые промпты
      const promptsToAdd = [];
      for (let i = 0; i < needed; i++) {
        const promptNumber = current + i + 1;
        const model = CONTENT_STRATEGY.categoryModelMapping[category]?.[0] || 'GPT-5';

        promptsToAdd.push({
          title: `Промпт ${category} #${promptNumber}`,
          description: `Автоматически созданный промпт для категории ${category}`,
          prompt: `Создай контент в категории ${category} с использованием модели ${model}. Будь креативным и профессиональным.`,
          model,
          lang: 'Русский',
          category,
          categoryId: categoryRecord.id,
          tags: category,
          license: 'CC-BY',
          authorId
        });
      }

      // Сохранить батчами
      for (let i = 0; i < promptsToAdd.length; i += 10) {
        const batch = promptsToAdd.slice(i, i + 10);

        await prisma.$transaction(async (tx) => {
          for (const promptData of batch) {
            // Проверяем уникальность
            const existing = await tx.prompt.findUnique({
              where: {
                title_authorId: {
                  title: promptData.title,
                  authorId: promptData.authorId
                }
              }
            });

            if (!existing) {
              await tx.prompt.create({ data: promptData });
              totalAdded++;
            }
          }
        });
      }

      console.log(`✅ Добавлено ${Math.min(needed, promptsToAdd.length)} промптов в ${category}`);
    }
  }

  console.log(`\n🎉 ДОБАВЛЕНИЕ ЗАВЕРШЕНО!`);
  console.log(`📊 Добавлено всего: ${totalAdded} промптов`);

  // Финальная проверка
  const finalCount = await prisma.prompt.count();
  console.log(`📈 Общее количество промптов в базе: ${finalCount}`);

  await prisma.$disconnect();
}

saveMissingPrompts().catch(console.error);
