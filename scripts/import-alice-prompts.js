/**
 * Импорт промптов Алисы из alice_prompts.json
 * - Создаёт/находит пользователя "Алиса"
 * - Создаёт промпты с корректными категориями и тегами
 * - Обновляет счётчики категорий и тегов
 * - Не трогает существующие промпты (idempotent по (title, author))
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Копируем функцию createPromptAndSync, как в import-prompthub5
async function createPromptAndSync(data) {
  return prisma.$transaction(async (tx) => {
    let categoryId = null;
    if (data.categoryRef && data.categoryRef.connect && data.categoryRef.connect.id) {
      categoryId = data.categoryRef.connect.id;
    }

    const created = await tx.prompt.create({ data });

    if (categoryId) {
      await tx.category.update({
        where: { id: categoryId },
        data: { promptCount: { increment: 1 } }
      });
    }

    return created;
  });
}

// Маппинг категорий из JSON в slug категорий на сайте
// Используем те же slug, что и в seed-categories/create-categories
const categoryMapping = {
  Chat: 'chat',
  Code: 'code',
  SEO: 'seo',
  Design: 'design',
  Legal: 'legal',
  Education: 'education',
  Image: 'image',
  Video: 'video',
  Music: 'music',
  Audio: 'audio',
  '3D': '3d',
  Animation: 'animation',
  Business: 'business',
  Marketing: 'marketing',
  Writing: 'writing',
  Translation: 'translation',
  Research: 'research',
  Analysis: 'analysis',
  Creative: 'creative',
  Productivity: 'productivity',
  Gaming: 'gaming',
  Health: 'health',
  Finance: 'finance',
  Cooking: 'cooking'
};

/**
 * Создать или найти тег
 */
async function getOrCreateTag(tagName) {
  const slug = tagName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё-]/g, '');

  // Сначала ищем по slug (надёжнее)
  let tag = await prisma.tag.findFirst({
    where: { slug }
  });

  // Если не нашли по slug, пробуем по имени
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
 * Импорт промптов Алисы
 */
async function importAlicePrompts() {
  console.log('🚀 Начинаем импорт промптов Алисы из alice_prompts.json...\n');

  try {
    const filePath = path.join(__dirname, '..', 'alice_prompts.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл ${filePath} не найден`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Неверный формат JSON: отсутствует массив items');
    }

    console.log(`📁 Найдено ${data.items.length} промптов Алисы для импорта\n`);

    // Находим или создаём пользователя Алиса
    let aliceUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'alice@prompthub.local' },
          { name: 'Алиса' }
        ]
      }
    });

    if (!aliceUser) {
      aliceUser = await prisma.user.create({
        data: {
          email: 'alice@prompthub.local',
          name: 'Алиса',
          bio: 'Автор промптов для Яндекс Алисы.',
          reputationScore: 0,
          reputationPromptCount: 0,
          reputationLikesCnt: 0,
          reputationSavesCnt: 0,
          reputationRatingsCnt: 0,
          reputationCommentsCnt: 0
        }
      });
      console.log('✅ Создан пользователь Алиса');
    } else {
      console.log(`ℹ️ Используем существующего пользователя: ${aliceUser.id} (${aliceUser.name || 'без имени'})`);
    }

    const imported = [];
    const skipped = [];
    const errors = [];

    const languageMapping = {
      Русский: 'Русский',
      ru: 'Русский',
      en: 'English',
      English: 'English',
      multi: 'English'
    };

    for (const item of data.items) {
      try {
        // Проверяем, не существует ли уже такой промпт у Алисы
        const existing = await prisma.prompt.findFirst({
          where: {
            title: item.title,
            authorId: aliceUser.id
          }
        });

        if (existing) {
          console.log(`⏭️  Пропущен (уже существует у Алисы): ${item.title}`);
          skipped.push(item.title);
          continue;
        }

        // Маппинг категории
        const categorySlug = categoryMapping[item.category];
        if (!categorySlug) {
          throw new Error(`Неизвестная категория в JSON: ${item.category}`);
        }

        // Пытаемся найти категорию по slug; если её нет в БД, создаём промпт БЕЗ связи categoryRef
        let category = null;
        let categoryNameForPrompt = item.category; // по умолчанию то, что пришло в JSON
        let categoryRef = undefined;

        try {
          category = await findCategoryBySlug(categorySlug);
          categoryNameForPrompt = category.nameEn;
          categoryRef = {
            connect: { id: category.id }
          };
        } catch (e) {
          console.warn(
            `⚠️ Категория со slug "${categorySlug}" не найдена в базе, промпт "${item.title}" будет создан без categoryRef:`,
            e.message
          );
        }

        // Строка тегов для старого поля
        const tagsString = Array.isArray(item.tags)
          ? item.tags.join(', ')
          : (item.tags || '');

        // Описание: берём summary и, при желании, можем добавить список переменных
        let description = item.summary || '';
        if (Array.isArray(item.variables) && item.variables.length > 0) {
          const varsList = item.variables
            .map(v => v.name)
            .filter(Boolean)
            .join(', ');
          if (varsList) {
            description += `\n\nПеременные: ${varsList}`;
          }
        }

        const mappedLanguage = languageMapping[item.language] || 'Русский';

        const promptData = {
          title: item.title,
          description: description.trim(),
          prompt: item.prompt_text || item.prompt || '',
          model: item.model || 'Яндекс Алиса',
          lang: mappedLanguage,
          category: categoryNameForPrompt,
          tags: tagsString,
          license: item.license || 'CC-BY',
          author: {
            connect: { id: aliceUser.id }
          },
          averageRating: 0,
          totalRatings: 0,
          views: 0
        };

        // Добавляем categoryRef только если категория реально найдена
        if (categoryRef) {
          promptData.categoryRef = categoryRef;
        }

        const prompt = await createPromptAndSync(promptData);

        if (category) {
          console.log(`✅ Создан промпт Алисы: ${item.title} (категория: ${category.nameRu})`);
        } else {
          console.log(`✅ Создан промпт Алисы БЕЗ связанной категории: ${item.title} (category="${categoryNameForPrompt}")`);
        }

        // Создаём/находим теги и связываем с промптом
        if (Array.isArray(item.tags)) {
          for (const rawTagName of item.tags) {
            const tagName = (rawTagName || '').trim();
            if (!tagName) continue;

            const tag = await getOrCreateTag(tagName);

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
          category: category ? category.nameRu : categoryNameForPrompt,
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

    // Обновляем репутацию Алисы по количеству промптов
    const promptCount = await prisma.prompt.count({
      where: { authorId: aliceUser.id }
    });

    await prisma.user.update({
      where: { id: aliceUser.id },
      data: { reputationPromptCount: promptCount }
    });

    console.log('\n📊 Итоговая статистика по импорту Алисы:');
    console.log(`✅ Импортировано: ${imported.length}`);
    console.log(`⏭️  Пропущено (уже были): ${skipped.length}`);
    console.log(`❌ Ошибок: ${errors.length}`);

    if (imported.length > 0) {
      console.log('\n📝 Импортированные промпты Алисы:');
      imported.forEach(p => {
        console.log(`  - ${p.title} (${p.category})`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Ошибки при импорте промптов Алисы:');
      errors.forEach(e => {
        console.log(`  - ${e.title}: ${e.error}`);
      });
    }

    console.log('\n🎉 Импорт промптов Алисы завершён!');
  } catch (error) {
    console.error('❌ Критическая ошибка при импорте Алисы:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importAlicePrompts().catch((error) => {
  console.error('Fatal error in import-alice-prompts:', error);
  process.exit(1);
});


