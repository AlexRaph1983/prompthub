const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Маппинг старых категорий на новые
const categoryMapping = {
  'Legal': 'legal',
  'Health': 'health', 
  'Education': 'education',
  'Marketing': 'marketing-writing',
  'Writing': 'marketing-writing',
  'Image': 'image',
  'Video': 'video',
  'Chat': 'chat',
  'Code': 'code',
  'SEO': 'seo',
  'Design': 'design',
  'Music': 'music',
  'Audio': 'audio',
  '3D': '3d',
  'Animation': 'animation',
  'Business': 'business',
  'Research': 'research',
  'Analysis': 'analysis',
  'Creative': 'creative',
  'Productivity': 'productivity',
  'Gaming': 'gaming',
  'Finance': 'finance',
  'Cooking': 'cooking'
};

async function migrateExistingPrompts() {
  try {
    console.log('🔄 Начинаем миграцию существующих промптов...\n');
    
    // Получаем все промпты без связи с новыми категориями
    const existingPrompts = await prisma.prompt.findMany({
      where: { categoryId: null },
      select: {
        id: true,
        title: true,
        category: true,
        tags: true
      }
    });
    
    console.log(`📊 Найдено промптов для миграции: ${existingPrompts.length}`);
    
    if (existingPrompts.length === 0) {
      console.log('✅ Все промпты уже мигрированы!');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    
    for (const prompt of existingPrompts) {
      try {
        // Ищем соответствующую новую категорию
        const newCategorySlug = categoryMapping[prompt.category];
        
        if (!newCategorySlug) {
          console.log(`⚠️ Неизвестная категория: ${prompt.category} (промпт: ${prompt.title})`);
          skipped++;
          continue;
        }
        
        const category = await prisma.category.findUnique({
          where: { slug: newCategorySlug }
        });
        
        if (!category) {
          console.log(`❌ Категория не найдена: ${newCategorySlug}`);
          skipped++;
          continue;
        }
        
        // Связываем промпт с новой категорией
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { categoryId: category.id }
        });
        
        console.log(`✅ Мигрирован: ${prompt.title} → ${category.nameRu}`);
        migrated++;
        
        // Мигрируем теги, если они есть
        if (prompt.tags) {
          const tagNames = prompt.tags.split(',').map(t => t.trim()).filter(Boolean);
          
          for (const tagName of tagNames) {
            // Ищем существующий тег или создаём новый
            let tag = await prisma.tag.findFirst({
              where: { 
                OR: [
                  { name: tagName },
                  { slug: tagName.toLowerCase().replace(/\s+/g, '-') }
                ]
              }
            });
            
            if (!tag) {
              tag = await prisma.tag.create({
                data: {
                  name: tagName,
                  slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                  description: `Тег: ${tagName}`,
                  isNsfw: tagName.toLowerCase().includes('nsfw')
                }
              });
              console.log(`  🏷️ Создан новый тег: ${tagName}`);
            }
            
            // Связываем промпт с тегом
            await prisma.promptTag.upsert({
              where: {
                promptId_tagId: {
                  promptId: prompt.id,
                  tagId: tag.id
                }
              },
              update: {},
              create: {
                promptId: prompt.id,
                tagId: tag.id
              }
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Ошибка миграции промпта ${prompt.id}:`, error.message);
        skipped++;
      }
    }
    
    // Обновляем счётчики
    console.log('\n📊 Обновляем счётчики...');
    await prisma.category.updateMany({
      data: {
        promptCount: await prisma.prompt.count({
          where: { categoryId: { not: null } }
        })
      }
    });
    
    console.log('\n🎉 Миграция завершена!');
    console.log(`✅ Мигрировано: ${migrated}`);
    console.log(`⚠️ Пропущено: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingPrompts();
