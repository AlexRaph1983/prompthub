/**
 * Импорт новых промптов из new_prompts_batch_3.json
 * - Создаёт/находит пользователя "PromptMaster"
 * - Создаёт промпты с корректными категориями и тегами
 * - Обновляет счётчики категорий и тегов
 * - Не трогает существующие промпты (idempotent по (title, author))
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Копируем функцию createPromptAndSync
async function createPromptAndSync(data) {
  return prisma.$transaction(async (tx) => {
    const categoryId = data.categoryId || null;
    const { categoryId: _, categoryRef: __, ...promptData } = data;

    const created = await tx.prompt.create({ 
      data: {
        ...promptData,
        categoryId
      }
    });

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

  let tag = await prisma.tag.findFirst({
    where: { slug }
  });

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
 * Импорт промптов
 */
async function importNewPrompts() {
  console.log('🚀 Начинаем импорт промптов из new_prompts_batch_3.json...\n');

  try {
    const filePath = path.join(__dirname, '..', 'new_prompts_batch_3.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл ${filePath} не найден`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Неверный формат JSON: отсутствует массив items');
    }

    console.log(`📁 Найдено ${data.items.length} промптов для импорта\n`);

    // Находим или создаём пользователя PromptMaster
    let promptMasterUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'promptmaster@prompthub.com' },
          { name: 'PromptMaster' }
        ]
      }
    });

    if (!promptMasterUser) {
      promptMasterUser = await prisma.user.create({
        data: {
          email: 'promptmaster@prompthub.com',
          name: 'PromptMaster',
          bio: 'Автор промптов для PromptHub.',
          reputationScore: 0,
          reputationPromptCount: 0,
          reputationLikesCnt: 0,
          reputationSavesCnt: 0,
          reputationRatingsCnt: 0,
          reputationCommentsCnt: 0
        }
      });
      console.log('✅ Создан пользователь PromptMaster');
    } else {
      console.log(`ℹ️ Используем существующего пользователя: ${promptMasterUser.id} (${promptMasterUser.name || 'без имени'})`);
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

        // Маппинг категории
        const categorySlug = categoryMapping[item.category];
        if (!categorySlug) {
          console.warn(`⚠️ Неизвестная категория: ${item.category}, используем 'creative'`);
          categorySlug = 'creative';
        }

        // Пытаемся найти категорию по slug
        let category = null;
        let categoryNameForPrompt = item.category;
        let categoryId = null;

        try {
          category = await findCategoryBySlug(categorySlug);
          categoryNameForPrompt = category.nameEn || category.nameRu;
          categoryId = category.id;
        } catch (e) {
          console.warn(
            `⚠️ Категория со slug "${categorySlug}" не найдена в базе, промпт "${item.title}" будет создан без categoryId:`,
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
          model: item.model || 'GPT-5',
          lang: mappedLanguage,
          category: categoryNameForPrompt,
          tags: tagsString,
          license: item.license || 'CC-BY',
          authorId: promptMasterUser.id,
          averageRating: 0,
          totalRatings: 0,
          views: 0,
          categoryId
        };

        const created = await createPromptAndSync(promptData);

        // Создаём/находим теги и связываем с промптом
        if (Array.isArray(item.tags) && item.tags.length > 0) {
          for (const tagName of item.tags) {
            if (!tagName || typeof tagName !== 'string') continue;

            const tag = await getOrCreateTag(tagName.trim());

            // Проверяем, не связан ли уже тег с промптом
            const existingLink = await prisma.promptTag.findFirst({
              where: {
                promptId: created.id,
                tagId: tag.id
              }
            });

            if (!existingLink) {
              await prisma.promptTag.create({
                data: {
                  promptId: created.id,
                  tagId: tag.id
                }
              });

              // Обновляем счётчик тега
              await prisma.tag.update({
                where: { id: tag.id },
                data: { promptCount: { increment: 1 } }
              });
            }
          }
        }

        console.log(`✅ Импортирован: ${item.title}`);
        imported.push(item.title);

      } catch (error) {
        console.error(`❌ Ошибка при импорте "${item.title}":`, error.message);
        errors.push({ title: item.title, error: error.message });
      }
    }

    console.log('\n📊 Итоги импорта:');
    console.log(`✅ Импортировано: ${imported.length}`);
    console.log(`⏭️  Пропущено: ${skipped.length}`);
    console.log(`❌ Ошибок: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Ошибки:');
      errors.forEach(({ title, error }) => {
        console.log(`  - ${title}: ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск
importNewPrompts()
  .then(() => {
    console.log('\n✅ Импорт завершён');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Импорт провалился:', error);
    process.exit(1);
  });

