/**
 * Безопасный импорт промптов из JSON
 * Использует createPromptAndSync для автоматического обновления счётчиков категорий
 * Создаёт/находит теги и связывает их с промптами
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Копируем функцию createPromptAndSync для использования в скрипте
async function createPromptAndSync(data) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.prompt.create({ data });
    
    // Если указана категория, увеличиваем счётчик
    if (created.categoryId) {
      await tx.category.update({
        where: { id: created.categoryId },
        data: { promptCount: { increment: 1 } }
      });
    }
    
    return created;
  });
}

// Маппинг категорий из JSON в slug категорий на сайте
const categoryMapping = {
  'marketing': 'marketing',
  'music': 'music',
  'audio': 'audio',
  'writing': 'writing',
  'design': 'design',
  '3d': '3d',
  'cooking': 'cooking',
  'video': 'video'
};

// Данные для импорта
const promptsData = {
  "version": "1.0",
  "items": [
    {
      "title": "Создание вирусного персонажа для соцсетей",
      "summary": "Промпт помогает придумать узнаваемого персонажа с мемным потенциалом для продвижения в TikTok и Instagram.",
      "language": "ru",
      "model": "gpt-4o",
      "category": "marketing",
      "license": "CC0",
      "tags": ["виральный", "персонаж", "бренд", "tiktok"],
      "prompt_text": "Придумай вирусного персонажа для соцсетей. Опиши его внешность, поведение, типичный стиль речи и фразу-слоган. Он должен быть легко узнаваем и вызывать эмоции у аудитории {аудитория}.",
      "variables": [
        { "name": "аудитория", "type": "string", "required": true, "description": "Основная целевая аудитория", "example": "молодежь 18–25 лет" }
      ],
      "usage_instructions": "Добавь ироничные черты и мемные ситуации. Работает для брендов, блогов и инфлюенсеров.",
      "examples": ["Аудитория: студенты и офисные работники"]
    },
    {
      "title": "Рок-баллада о внутренней силе",
      "summary": "Создай мощную рок-балладу с эмоциональным вокалом, гитарным соло и драматическим развитием.",
      "language": "en",
      "model": "any",
      "category": "music",
      "license": "CC0",
      "tags": ["rock", "баллада", "гитара", "эмоции"],
      "prompt_text": "Write a rock ballad with emotional vocals, soft verses, and a powerful chorus about {theme}. Include guitar solos and cinematic dynamics.",
      "variables": [
        { "name": "theme", "type": "string", "required": true, "description": "Тематика песни", "example": "overcoming pain" }
      ],
      "usage_instructions": "Добавь медленное вступление и постепенное усиление к финалу.",
      "examples": ["Theme: hope after loss"]
    },
    {
      "title": "Энергичный трек в стиле электронной танцевальной музыки",
      "summary": "Создай трек в жанре EDM с плотным битом, ярким синтезатором и энергией танцпола.",
      "language": "en",
      "model": "any",
      "category": "music",
      "license": "CC0",
      "tags": ["electronic", "edm", "dance", "club"],
      "prompt_text": "Generate an electronic dance track with punchy kick, bright leads, and dynamic build-ups. Tempo {bpm} BPM, vibe {vibe}.",
      "variables": [
        { "name": "bpm", "type": "number", "required": false, "description": "Темп композиции", "example": "128" },
        { "name": "vibe", "type": "string", "required": false, "description": "Общее настроение трека", "example": "uplifting" }
      ],
      "usage_instructions": "Используй для вечеринок, рекламных видео и фитнес-плейлистов.",
      "examples": ["EDM 128 BPM, euphoric vibe"]
    },
    {
      "title": "Самба — ритм солнца и праздника",
      "summary": "Создай трек в жанре самба с живой перкуссией, гитарой и праздничной атмосферой.",
      "language": "multi",
      "model": "any",
      "category": "music",
      "license": "CC0",
      "tags": ["samba", "latina", "ритм", "бразилия"],
      "prompt_text": "Produce a Samba track with live percussion, acoustic guitar, brass, and carnival energy. Include call-and-response vocals and a festive groove.",
      "usage_instructions": "Идеально для летних видео и танцевальных вечеринок.",
      "examples": ["Brazilian samba with acoustic guitar and brass"]
    },
    {
      "title": "Музыка для спортивных видео и мотивации",
      "summary": "Создай мощный трек в жанре sport rock или hybrid trap для фитнеса и спортивных роликов.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC0",
      "tags": ["sport", "motivation", "energy", "fitness"],
      "prompt_text": "Generate a high-energy track for sport or fitness content. Combine aggressive beats, guitars, and cinematic drops. Emotion: {emotion}.",
      "variables": [
        { "name": "emotion", "type": "string", "required": false, "description": "Основное настроение", "example": "power and determination" }
      ],
      "usage_instructions": "Используй для промо-видео, тренировок и YouTube Shorts.",
      "examples": ["Hybrid rock-trap sport anthem"]
    },
    {
      "title": "Идеи для писателя: генератор сюжетов",
      "summary": "Промпт для писателей — генерирует уникальные сюжетные линии и конфликты для романов и рассказов.",
      "language": "ru",
      "model": "gpt-4.1",
      "category": "writing",
      "license": "CC0",
      "tags": ["писатель", "сюжет", "литература", "роман"],
      "prompt_text": "Придумай 5 сюжетных идей для книги в жанре {жанр}. Главный герой — {герой}. Каждая идея должна содержать конфликт и эмоциональную развязку.",
      "variables": [
        { "name": "жанр", "type": "string", "required": true, "description": "Жанр произведения", "example": "фантастика" },
        { "name": "герой", "type": "string", "required": false, "description": "Тип главного героя", "example": "учёный, потерявший память" }
      ],
      "usage_instructions": "Выбери самую сильную идею и развей её в отдельную сцену.",
      "examples": ["Жанр: триллер; герой: журналист-расследователь"]
    },
    {
      "title": "Креативный логотип с котом для бренда",
      "summary": "Создай минималистичный логотип с котом — идеально для кофеен, студий или блогов.",
      "language": "ru",
      "model": "gpt-4.1-mini",
      "category": "design",
      "license": "CC0",
      "tags": ["дизайн", "кот", "лого", "бренд"],
      "prompt_text": "Создай логотип с изображением кота в стиле {стиль}. Основные цвета: {цвета}. Логотип должен вызывать ассоциации с {ассоциация}.",
      "variables": [
        { "name": "стиль", "type": "string", "required": false, "description": "Графический стиль", "example": "минимализм" },
        { "name": "цвета", "type": "string", "required": false, "description": "Цветовая палитра", "example": "черный и золотой" },
        { "name": "ассоциация", "type": "string", "required": false, "description": "Желаемое впечатление", "example": "уют и тепло" }
      ],
      "usage_instructions": "Подходит для брендов, связанных с комфортом и креативом.",
      "examples": ["Логотип кота для кофейни в золотом тоне"]
    },
    {
      "title": "Рок-композиция с живыми инструментами",
      "summary": "Создай современный рок-трек с драйвом, мощным вокалом и живыми гитарами.",
      "language": "en",
      "model": "any",
      "category": "music",
      "license": "CC0",
      "tags": ["rock", "гитара", "live", "drums"],
      "prompt_text": "Produce a rock track with live guitars, bass, and drums. Energy level {energy}. Include bridge and solo section.",
      "variables": [
        { "name": "energy", "type": "string", "required": false, "description": "Уровень энергии", "example": "high and raw" }
      ],
      "usage_instructions": "Подходит для фильмов, игр и спортивных видео.",
      "examples": ["Modern rock 120 BPM with guitar solo"]
    },
    {
      "title": "3D-модель персонажа для анимации",
      "summary": "Создай 3D-модель персонажа с выражением эмоций и возможностью анимации.",
      "language": "ru",
      "model": "mistral-large-latest",
      "category": "3d",
      "license": "CC0",
      "tags": ["3d", "персонаж", "анимация", "дизайн"],
      "prompt_text": "Создай 3D-модель персонажа {описание} для анимационного проекта. Добавь текстуру, эмоции и нейтральную позу T-позиции.",
      "variables": [
        { "name": "описание", "type": "string", "required": true, "description": "Краткое описание внешности персонажа", "example": "весёлый робот с антеннами" }
      ],
      "usage_instructions": "Добавь текстуры в высоком разрешении для рендеров.",
      "examples": ["Робот с глазами-экранами в T-позе"]
    },
    {
      "title": "Кулинарный рецепт в стиле самба",
      "summary": "Придумай оригинальное блюдо в бразильском стиле с нотами тропических фруктов.",
      "language": "ru",
      "model": "gpt-4o-mini",
      "category": "cooking",
      "license": "CC0",
      "tags": ["самба", "еда", "рецепт", "бразилия"],
      "prompt_text": "Создай рецепт блюда в стиле самба — яркого, насыщенного и ароматного. Основные ингредиенты: {ингредиенты}. Опиши процесс приготовления и подачу.",
      "variables": [
        { "name": "ингредиенты", "type": "string", "required": false, "description": "Список основных ингредиентов", "example": "курица, лайм, манго" }
      ],
      "usage_instructions": "Добавь подачу с ананасом и цветным перцем для красоты.",
      "examples": ["Курица с манго и кокосом в стиле самба"]
    }
  ]
};

/**
 * Создать или найти тег
 */
async function getOrCreateTag(tagName) {
  const slug = tagName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  let tag = await prisma.tag.findFirst({
    where: {
      OR: [
        { slug },
        { name: { equals: tagName, mode: 'insensitive' } }
      ]
    }
  });

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
  console.log('🚀 Начинаем импорт промптов...\n');

  try {
    // Находим или создаём системного пользователя для импорта
    let systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'system@prompthub.site' },
          { name: 'System' }
        ]
      }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@prompthub.site',
          name: 'System',
          role: 'USER'
        }
      });
      console.log('✅ Создан системный пользователь для импорта');
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
        const tagsString = item.tags.join(', ');

        // Формируем описание с переменными и инструкциями
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
          prompt: item.prompt_text,
          model: item.model || 'any',
          lang: item.language || 'ru',
          category: category.nameEn, // Старое поле для совместимости
          categoryId: category.id,    // Новое поле с foreign key
          tags: tagsString,
          license: item.license || 'CC0',
          author: {
            connect: { id: systemUser.id }
          }
        });

        console.log(`✅ Создан промпт: ${item.title} (категория: ${category.nameRu})`);

        // Создаём/находим теги и связываем с промптом
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

        imported.push({
          title: item.title,
          category: category.nameRu,
          tags: item.tags
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

