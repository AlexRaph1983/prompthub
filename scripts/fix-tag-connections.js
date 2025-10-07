const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTagConnections() {
  try {
    console.log('🔗 Исправляем связи тегов с промптами...');
    
    // Получаем все промпты с тегами
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        tags: true
      }
    });
    
    console.log(`📊 Найдено промптов: ${prompts.length}`);
    
    let connectedCount = 0;
    let errorCount = 0;
    
    for (const prompt of prompts) {
      if (prompt.tags) {
        const tagNames = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        for (const tagName of tagNames) {
          try {
            // Создаем slug из названия тега
            const slug = tagName
              .toLowerCase()
              .replace(/[^a-z0-9а-я\s]/g, '')
              .replace(/\s+/g, '-')
              .trim();
            
            // Находим тег по slug
            const tag = await prisma.tag.findUnique({
              where: { slug }
            });
            
            if (tag) {
              // Создаем связь, если её нет
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
              
              connectedCount++;
              console.log(`✅ Связан промпт "${prompt.title}" с тегом "${tagName}"`);
            } else {
              console.log(`⚠️ Тег "${tagName}" не найден в базе данных`);
            }
          } catch (error) {
            errorCount++;
            console.error(`❌ Ошибка связи промпта "${prompt.title}" с тегом "${tagName}":`, error.message);
          }
        }
      }
    }
    
    // Обновляем счетчики тегов
    console.log('\n📊 Обновляем счетчики тегов...');
    
    const tags = await prisma.tag.findMany({
      select: { id: true, slug: true }
    });
    
    for (const tag of tags) {
      const count = await prisma.promptTag.count({
        where: { tagId: tag.id }
      });
      
      await prisma.tag.update({
        where: { id: tag.id },
        data: { promptCount: count }
      });
      
      console.log(`✅ Обновлен счетчик для тега "${tag.slug}": ${count} промптов`);
    }
    
    console.log(`\n✅ Связи исправлены!`);
    console.log(`📊 Статистика:`);
    console.log(`  - Создано связей: ${connectedCount}`);
    console.log(`  - Ошибок: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTagConnections();
