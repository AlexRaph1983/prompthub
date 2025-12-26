const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importPromptmasterPrompts() {
  try {
    console.log('🚀 Начинаем импорт промптов PromptMaster...');

    // Читаем промпты
    const promptsFile = path.join(__dirname, '..', 'promptmaster_prompts_for_import.json');
    const prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

    console.log(`Найдено ${prompts.length} промптов для импорта`);

    // Используем существующего пользователя PromptMaster
    const promptmasterUser = await prisma.user.findFirst({
      where: { name: 'PromptMaster' }
    });

    if (!promptmasterUser) {
      console.error('❌ Пользователь PromptMaster не найден!');
      return;
    }

    console.log('✅ Найден пользователь PromptMaster:', promptmasterUser.id);

    // Импортируем промпты
    const importedPrompts = [];

    for (const promptData of prompts) {
      try {
        // Проверяем, существует ли уже такой промпт (ищем по названию и автору)
        const existingPrompt = await prisma.prompt.findFirst({
          where: {
            title: promptData.title,
            authorId: promptmasterUser.id
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
          // Пробуем найти по английскому названию или сопоставить с существующими
          const categoryMap = {
            'Analysis': 'Продуктивность',      // Analysis -> Productivity
            'Creative': 'Письмо',             // Creative -> Writing
            'Business': 'Маркетинг',          // Business -> Marketing
            'Writing': 'Письмо',              // Writing -> Writing
            'Legal': 'Продуктивность',        // Legal -> Productivity
            'Music': 'Музыка',                // Music -> Music
            'Animation': 'Видео',             // Animation -> Video
            'Design': 'Дизайн',               // Design -> Design
            'Marketing': 'Маркетинг',         // Marketing -> Marketing
            'Productivity': 'Продуктивность', // Productivity -> Productivity
            'Research': 'Продуктивность',     // Research -> Productivity
            'Image': 'Изображения',           // Image -> Image
            'Cooking': 'Кулинария'            // Cooking -> Cooking
          };

          const mappedCategoryRu = categoryMap[promptData.category];

          if (mappedCategoryRu) {
            category = await prisma.category.findFirst({
              where: { nameRu: mappedCategoryRu }
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
            authorId: promptmasterUser.id
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

    console.log(`📊 Результаты импорта:`);
    console.log(`✅ Импортировано промптов: ${importedPrompts.length}`);
    console.log(`📂 Обновлено категорий: ${categories.length}`);

    console.log('🎉 Импорт промптов PromptMaster завершен успешно!');

  } catch (error) {
    console.error('❌ Критическая ошибка импорта:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importPromptmasterPrompts();
