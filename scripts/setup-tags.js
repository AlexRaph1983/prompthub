const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTags() {
  try {
    console.log('🏷️ Создаем систему тегов...');
    
    // Получаем все промпты с тегами
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        tags: true
      }
    });
    
    console.log(`📊 Найдено промптов: ${prompts.length}`);
    
    // Собираем все уникальные теги с подсчетом
    const tagCounts = {};
    const tagPrompts = {};
    
    prompts.forEach(prompt => {
      if (prompt.tags) {
        const tags = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          if (!tagPrompts[tag]) tagPrompts[tag] = [];
          tagPrompts[tag].push(prompt.id);
        });
      }
    });
    
    console.log(`🏷️ Уникальных тегов: ${Object.keys(tagCounts).length}`);
    
    // Создаем теги в базе данных
    console.log('📝 Создаем теги в базе данных...');
    
    for (const [tagName, count] of Object.entries(tagCounts)) {
      // Создаем slug из названия тега
      const slug = tagName
        .toLowerCase()
        .replace(/[^a-z0-9а-я\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      try {
        const tag = await prisma.tag.upsert({
          where: { slug },
          update: {
            name: tagName,
            promptCount: count,
            isActive: true
          },
          create: {
            name: tagName,
            slug,
            promptCount: count,
            isActive: true
          }
        });
        
        console.log(`✅ Создан тег: ${tagName} (${count} промптов)`);
        
        // Создаем связи с промптами
        for (const promptId of tagPrompts[tagName]) {
          try {
            await prisma.promptTag.upsert({
              where: {
                promptId_tagId: {
                  promptId,
                  tagId: tag.id
                }
              },
              update: {},
              create: {
                promptId,
                tagId: tag.id
              }
            });
          } catch (error) {
            // Игнорируем дубликаты
            if (!error.message.includes('Unique constraint')) {
              console.error(`❌ Ошибка связи тега ${tagName} с промптом ${promptId}:`, error.message);
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Ошибка создания тега ${tagName}:`, error.message);
      }
    }
    
    // Получаем топ-20 тегов для проверки
    const topTags = await prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { promptCount: 'desc' },
      take: 20,
      select: {
        name: true,
        slug: true,
        promptCount: true
      }
    });
    
    console.log('\n📈 Топ-20 тегов в базе данных:');
    topTags.forEach((tag, index) => {
      console.log(`  ${index + 1}. ${tag.name} (${tag.promptCount} промптов) - /tag/${tag.slug}`);
    });
    
    console.log('\n✅ Система тегов создана успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTags();
