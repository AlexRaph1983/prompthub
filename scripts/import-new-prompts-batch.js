/**
 * Безопасный импорт новых промптов из JSON
 * Проверяет существование перед добавлением, не повреждает старые промпты
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Маппинг категорий из JSON в slug категорий в базе
const categoryMapping = {
  'Music': 'music',
  'Video': 'video',
  'Writing': 'writing', // Используем 'writing' вместо 'marketing-writing'
  'Creative': 'design', // Используем 'design' для творческих промптов
  'Marketing': 'marketing', // Используем 'marketing' вместо 'marketing-writing'
  'Animation': 'video', // Используем 'video' для анимации
  'Health': 'productivity', // Используем 'productivity' для здоровья
  'Audio': 'audio',
  'Design': 'design',
  'Image': 'image',
  'Code': 'productivity', // Используем 'productivity' для кода
  'Chat': 'productivity', // Используем 'productivity' для чата
  'SEO': 'marketing', // Используем 'marketing' для SEO
  'Legal': 'productivity', // Используем 'productivity' для юридических
  'Education': 'productivity', // Используем 'productivity' для образования
  'Business': 'marketing', // Используем 'marketing' для бизнеса
  'Research': 'productivity', // Используем 'productivity' для исследований
  'Analysis': 'productivity', // Используем 'productivity' для анализа
  'Productivity': 'productivity',
  'Gaming': 'design', // Используем 'design' для игр
  'Finance': 'productivity', // Используем 'productivity' для финансов
  'Cooking': 'cooking',
  '3D': '3d'
};

// Маппинг языков
const languageMapping = {
  'English': 'English',
  'Русский': 'Русский',
  'Español': 'English', // Если нет испанского, используем английский
  'Deutsch': 'English'  // Если нет немецкого, используем английский
};

/**
 * Создать или найти тег
 */
async function getOrCreateTag(tagName) {
  const slug = tagName.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё-]/g, '');
  
  // Ищем по slug
  let tag = await prisma.tag.findFirst({
    where: { slug }
  });

  // Если не нашли по slug, ищем по точному совпадению имени
  if (!tag) {
    tag = await prisma.tag.findFirst({
      where: { name: tagName }
    });
  }

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name: tagName,
        slug,
        isActive: true,
        promptCount: 0
      }
    });
    console.log(`✅ Создан тег: ${tagName} (${slug})`);
  }

  return tag;
}

/**
 * Найти категорию по slug
 */
async function findCategoryBySlug(slug) {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isActive: true
    }
  });

  if (!category) {
    throw new Error(`Категория "${slug}" не найдена в базе данных`);
  }

  return category;
}

/**
 * Создать промпт и обновить счетчик категории
 */
async function createPromptAndSync(data) {
  return prisma.$transaction(async (tx) => {
    // Извлекаем categoryId из categoryRef.connect.id если есть
    let categoryId = null;
    if (data.categoryRef && data.categoryRef.connect && data.categoryRef.connect.id) {
      categoryId = data.categoryRef.connect.id;
    }
    
    const created = await tx.prompt.create({ data });
    
    // Если указана категория, увеличиваем счётчик
    if (categoryId) {
      await tx.category.update({
        where: { id: categoryId },
        data: { promptCount: { increment: 1 } }
      });
    }
    
    return created;
  });
}

/**
 * Импорт промптов
 */
async function importPrompts() {
  console.log('🚀 Начинаем импорт новых промптов...\n');

  try {
    // Находим или создаём пользователя PromptMaster
    let promptMasterUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'promptmaster@prompthub.local' },
          { name: 'PromptMaster' }
        ]
      }
    });

    if (!promptMasterUser) {
      promptMasterUser = await prisma.user.create({
        data: {
          id: 'promptmaster-' + Date.now(),
          name: 'PromptMaster',
          email: 'promptmaster@prompthub.local',
          bio: 'Template curator for PromptHub.',
          reputationScore: 13,
          reputationPromptCount: 0,
          reputationLikesCnt: 0,
          reputationSavesCnt: 0,
          reputationRatingsCnt: 0,
          reputationCommentsCnt: 0
        }
      });
      console.log('✅ Создан пользователь PromptMaster');
    }

    // Читаем JSON из файла или используем данные из аргументов
    let promptsData;
    // Проверяем, указан ли файл как аргумент командной строки
    const fileName = process.argv[2] || 'new_prompts_batch.json';
    const filePath = path.join(__dirname, '..', fileName);
    
    if (fs.existsSync(filePath)) {
      promptsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📁 Загружено из файла ${fileName}: ${promptsData.items.length} промптов`);
    } else {
      // Используем данные из аргументов командной строки (если передан JSON напрямую)
      const dataArg = process.argv[2];
      if (dataArg && dataArg.startsWith('{')) {
        promptsData = JSON.parse(dataArg);
      } else {
        throw new Error(`Файл не найден: ${filePath}. Укажите имя файла как аргумент или передайте JSON напрямую.`);
      }
    }

    const imported = [];
    const skipped = [];
    const errors = [];

    for (const item of promptsData.items) {
      try {
        // Проверяем, не существует ли уже такой промпт
        const existing = await prisma.prompt.findFirst({
          where: {
            title: item.title,
            authorId: promptMasterUser.id
          }
        });

        if (existing) {
          console.log(`⏭️  Пропущен (уже существует): ${item.title}`);
          skipped.push(item.title);
          continue;
        }

        // Находим категорию
        const categorySlug = categoryMapping[item.category];
        if (!categorySlug) {
          throw new Error(`Неизвестная категория: ${item.category}`);
        }

        const category = await findCategoryBySlug(categorySlug);

        // Маппинг языка
        const mappedLanguage = languageMapping[item.language] || 'English';

        // Формируем строку тегов для старого поля
        const tagsString = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');

        // Формируем описание
        let description = item.summary || '';
        if (item.usage_instructions) {
          description += `\n\n${item.usage_instructions}`;
        }
        if (item.examples && item.examples.length > 0) {
          description += `\n\nПримеры: ${item.examples.join(', ')}`;
        }

        // Создаём промпт используя createPromptAndSync (автоматически обновит счётчик категории)
        const prompt = await createPromptAndSync({
          title: item.title,
          description: description.trim(),
          prompt: item.prompt_text || item.prompt || '',
          model: item.model || 'GPT-4o',
          lang: mappedLanguage,
          category: category.nameEn, // Старое поле для совместимости
          categoryRef: {
            connect: { id: category.id }
          },
          tags: tagsString,
          license: item.license || 'CC-BY',
          author: {
            connect: { id: promptMasterUser.id }
          },
          averageRating: 0,
          totalRatings: 0,
          views: 0
        });

        console.log(`✅ Создан промпт: ${item.title} (категория: ${category.nameRu})`);

        // Создаём/находим теги и связываем с промптом
        if (item.tags && Array.isArray(item.tags)) {
          for (const tagName of item.tags) {
            const tag = await getOrCreateTag(tagName);
            
            // Проверяем, не существует ли уже связь
            const existingLink = await prisma.promptTag.findFirst({
              where: {
                promptId: prompt.id,
                tagId: tag.id
              }
            });

            if (!existingLink) {
              await prisma.promptTag.create({
                data: {
                  promptId: prompt.id,
                  tagId: tag.id
                }
              });
            }
          }
        }

        imported.push({
          title: item.title,
          category: category.nameRu,
          tags: item.tags || []
        });

      } catch (error) {
        console.error(`❌ Ошибка при импорте "${item.title}":`, error.message);
        errors.push({ title: item.title, error: error.message });
      }
    }

    // Обновляем счётчики тегов
    console.log('\n🔄 Обновляем счётчики тегов...');
    const tags = await prisma.tag.findMany({
      select: { id: true }
    });

    for (const tag of tags) {
      const count = await prisma.promptTag.count({
        where: { tagId: tag.id }
      });

      await prisma.tag.update({
        where: { id: tag.id },
        data: { promptCount: count }
      });
    }

    // Итоговая статистика
    console.log('\n📊 Итоговая статистика:');
    console.log(`✅ Импортировано: ${imported.length}`);
    console.log(`⏭️  Пропущено: ${skipped.length}`);
    console.log(`❌ Ошибок: ${errors.length}`);

    if (imported.length > 0) {
      console.log('\n📝 Импортированные промпты:');
      imported.forEach(p => {
        console.log(`  - ${p.title} (${p.category})`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Ошибки:');
      errors.forEach(e => {
        console.log(`  - ${e.title}: ${e.error}`);
      });
    }

    console.log('\n🎉 Импорт завершён!');
    console.log('💡 Счётчики категорий обновлены автоматически');
    console.log('💡 Счётчики тегов обновлены');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск импорта
importPrompts()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

