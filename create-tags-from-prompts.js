const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTagsFromPrompts() {
  try {
    console.log('🔍 Creating tags from prompts...');
    
    // Получаем все промпты с тегами
    const prompts = await prisma.prompt.findMany({
      select: {
        tags: true,
      },
    });

    // Собираем все уникальные теги
    const allTags = new Set();
    prompts.forEach(prompt => {
      if (prompt.tags) {
        let tags = [];
        if (typeof prompt.tags === 'string') {
          tags = prompt.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else if (Array.isArray(prompt.tags)) {
          tags = prompt.tags.map(tag => String(tag).trim()).filter(Boolean);
        }
        tags.forEach(tag => allTags.add(tag));
      }
    });

    console.log(`Found ${allTags.size} unique tags in prompts`);

    // Создаем теги в таблице Tag
    let createdCount = 0;
    let skippedCount = 0;

    for (const tagName of allTags) {
      try {
        // Создаем slug из названия тега
        const slug = tagName
          .toLowerCase()
          .replace(/[^a-z0-9а-я\s]/g, '') // Убираем спецсимволы
          .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
          .replace(/--+/g, '-') // Убираем двойные дефисы
          .trim();

        // Проверяем, существует ли тег
        const existingTag = await prisma.tag.findFirst({
          where: {
            OR: [
              { name: tagName },
              { slug: slug }
            ]
          }
        });

        if (existingTag) {
          console.log(`⚠️  Tag "${tagName}" already exists`);
          skippedCount++;
          continue;
        }

        // Создаем тег
        const tag = await prisma.tag.create({
          data: {
            name: tagName,
            slug: slug,
            description: `Промпты с тегом "${tagName}"`,
            isActive: true,
            isNsfw: false,
          }
        });

        console.log(`✅ Created tag: "${tagName}" (slug: ${slug})`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating tag "${tagName}":`, error.message);
      }
    }

    console.log(`\n🎉 Tag creation completed!`);
    console.log(`✅ Created: ${createdCount} tags`);
    console.log(`⚠️  Skipped: ${skippedCount} tags`);

    // Обновляем счетчики тегов
    console.log('\n🔄 Updating tag counts...');
    
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true }
    });

    for (const tag of tags) {
      // Считаем промпты с этим тегом
      const count = await prisma.prompt.count({
        where: {
          tags: {
            contains: tag.name
          }
        }
      });

      // Обновляем счетчик
      await prisma.tag.update({
        where: { id: tag.id },
        data: { promptCount: count }
      });

      console.log(`✅ ${tag.name}: ${count} prompts`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTagsFromPrompts();
