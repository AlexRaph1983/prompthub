const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importHitmakerPrompts() {
  try {
    console.log('🚀 Начинаем импорт промптов HitMaker...');

    // Читаем промпты
    const promptsFile = path.join(__dirname, '..', 'hitmaker_prompts_for_import.json');
    const prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

    console.log(`Найдено ${prompts.length} промптов для импорта`);

    // Ищем существующего пользователя HitMaker или создаем нового
    let hitmakerUser = await prisma.user.findFirst({
      where: { name: 'HitMaker' }
    });

    if (!hitmakerUser) {
      console.log('Создаем пользователя HitMaker...');
      hitmakerUser = await prisma.user.create({
        data: {
          id: 'hitmaker-user-' + Date.now(),
          name: 'HitMaker',
          email: 'hitmaker@prompts.ai',
          image: null
        }
      });
      console.log('✅ Пользователь HitMaker создан:', hitmakerUser.id);
    } else {
      console.log('✅ Найден существующий пользователь HitMaker:', hitmakerUser.id);
    }

    // Импортируем промпты
    const importedPrompts = [];

    for (const promptData of prompts) {
      try {
        // Проверяем, существует ли уже такой промпт
        const existingPrompt = await prisma.prompt.findFirst({
          where: {
            title: promptData.title,
            authorId: hitmakerUser.id
          }
        });

        if (existingPrompt) {
          console.log(`⏭️  Промпт "${promptData.title}" уже существует, пропускаем`);
          continue;
        }

        // Находим категорию (проверяем разные варианты названий)
        let category = await prisma.category.findFirst({
          where: { nameRu: promptData.category }
        });

        if (!category) {
          // Пробуем найти по английскому названию
          const categoryMap = {
            'Анализ': 'Productivity',      // Analysis -> Productivity
            'Творчество': 'Writing',       // Creative -> Writing
            'Бизнес': 'Marketing',         // Business -> Marketing
            'Письмо': 'Writing',
            'Юриспруденция': 'Productivity', // Legal -> Productivity
            'Музыка': 'Music',
            'Анимация': 'Video',           // Animation -> Video
            'Дизайн': 'Design',
            'Маркетинг': 'Marketing',
            'Продуктивность': 'Productivity'
          };

          const englishName = categoryMap[promptData.category];
          if (englishName) {
            category = await prisma.category.findFirst({
              where: { nameEn: englishName }
            });
          }
        }

        if (!category) {
          console.log(`❌ Категория "${promptData.category}" не найдена, пропускаем промпт "${promptData.title}"`);
          continue;
        }

        // Создаем промпт
        const newPrompt = await prisma.prompt.create({
          data: {
            title: promptData.title,
            description: promptData.description,
            prompt: promptData.prompt,
            model: promptData.model,
            lang: promptData.lang,
            category: category.nameEn, // Используем английское название для поля category
            categoryId: category.id,
            tags: promptData.tags,
            license: promptData.license,
            authorId: hitmakerUser.id
          }
        });

        importedPrompts.push(newPrompt);
        console.log(`✅ Импортирован: "${promptData.title}"`);

      } catch (error) {
        console.error(`❌ Ошибка импорта "${promptData.title}":`, error.message);
      }
    }

    // Обновляем счетчики категорий
    console.log('🔄 Обновляем счетчики категорий...');
    const categories = await prisma.category.findMany();
    for (const category of categories) {
      const promptCount = await prisma.prompt.count({
        where: { categoryId: category.id }
      });

      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount }
      });
    }

    console.log('📊 Результаты импорта:');
    console.log(`✅ Импортировано промптов: ${importedPrompts.length}`);
    console.log(`📂 Обновлено категорий: ${categories.length}`);

    console.log('🎉 Импорт промптов HitMaker завершен успешно!');

  } catch (error) {
    console.error('❌ Критическая ошибка импорта:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importHitmakerPrompts();
