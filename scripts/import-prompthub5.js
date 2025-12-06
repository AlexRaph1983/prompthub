/**
 * Импорт промптов из prompts_prompthub5.json
 * Использует createPromptAndSync для автоматического обновления счётчиков категорий
 * Создаёт/находит теги и связывает их с промптами
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Копируем функцию createPromptAndSync для использования в скрипте
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

// Маппинг категорий из JSON в slug категорий на сайте
const categoryMapping = {
  'Writing': 'marketing-writing', // Используем объединённую категорию
  'Research': 'research',
  'Business': 'business',
  'SEO': 'seo',
  'Marketing': 'marketing-writing', // Используем объединённую категорию
  'Music': 'music',
  'Home': 'creative', // Используем Creative как альтернативу для Home
  'Technical': 'code', // Используем Code как альтернативу для Technical
  'Design': 'design',
  'Education': 'education',
  'Productivity': 'productivity',
  'Creative': 'creative'
};

/**
 * Создать или найти тег
 */
async function getOrCreateTag(tagName) {
  const slug = tagName.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё-]/g, '');
  
  // Ищем по slug (более надёжно)
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
 * Импорт промптов
 */
async function importPrompts() {
  console.log('🚀 Начинаем импорт промптов из prompts_prompthub5.json...\n');

  try {
    // Читаем JSON файл
    const filePath = path.join(__dirname, '..', 'prompts_prompthub5.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл ${filePath} не найден`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Неверный формат JSON: отсутствует массив items');
    }

    console.log(`📁 Найдено ${data.items.length} промптов для импорта\n`);

    // Находим или создаём системного пользователя для импорта
    let systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'promptmaster@prompthub.local' },
          { name: 'PromptMaster' },
          { id: 'promptmaster' }
        ]
      }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          id: 'promptmaster',
          email: 'promptmaster@prompthub.local',
          name: 'PromptMaster',
          bio: 'Template curator for PromptHub.',
          reputationScore: 13,
          reputationPromptCount: 0,
          reputationLikesCnt: 0,
          reputationSavesCnt: 0,
          reputationRatingsCnt: 0,
          reputationCommentsCnt: 0
        }
      });
      console.log('✅ Создан пользователь PromptMaster для импорта');
    }

    const imported = [];
    const skipped = [];
    const errors = [];

    for (const item of data.items) {
      try {
        // Проверяем, не существует ли уже такой промпт
        const existing = await prisma.prompt.findFirst({
          where: {
            title: item.title,
            authorId: systemUser.id
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

        // Формируем строку тегов для старого поля
        const tagsString = Array.isArray(item.tags) 
          ? item.tags.join(', ') 
          : (item.tags || '');

        // Формируем описание
        const description = item.summary || item.description || '';

        // Маппинг языка
        const languageMapping = {
          'Русский': 'Русский',
          'ru': 'Русский',
          'en': 'English',
          'English': 'English',
          'multi': 'English'
        };
        const mappedLanguage = languageMapping[item.language] || 'Русский';

        // Создаём промпт используя createPromptAndSync (автоматически обновит счётчик категории)
        const prompt = await createPromptAndSync({
          title: item.title,
          description: description.trim(),
          prompt: item.prompt_text || item.prompt || '',
          model: item.model || 'GPT-5',
          lang: mappedLanguage,
          category: category.nameEn, // Старое поле для совместимости
          categoryRef: {
            connect: { id: category.id }
          },
          tags: tagsString,
          license: item.license || 'CC-BY',
          author: {
            connect: { id: systemUser.id }
          },
          averageRating: 0,
          totalRatings: 0,
          views: 0
        });

        console.log(`✅ Создан промпт: ${item.title} (категория: ${category.nameRu})`);

        // Создаём/находим теги и связываем с промптом
        if (Array.isArray(item.tags)) {
          for (const tagName of item.tags) {
            if (!tagName || !tagName.trim()) continue;
            
            const tag = await getOrCreateTag(tagName.trim());
            
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

    // Обновляем репутацию пользователя
    const promptCount = await prisma.prompt.count({
      where: { authorId: systemUser.id }
    });

    await prisma.user.update({
      where: { id: systemUser.id },
      data: { reputationPromptCount: promptCount }
    });

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
    console.log('💡 Счётчики категорий обновлены автоматически через createPromptAndSync');
    console.log('💡 Счётчики тегов обновлены вручную');

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

