const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTagSlugs() {
  try {
    console.log('🔧 Исправляем slug для русских тегов...');
    
    // Получаем все теги с русскими slug
    const tags = await prisma.tag.findMany({
      where: {
        slug: {
          contains: 'а' // Любой русский символ
        }
      },
      select: { id: true, name: true, slug: true }
    });
    
    console.log(`📊 Найдено тегов с русскими slug: ${tags.length}`);
    
    for (const tag of tags) {
      // Создаем латинский slug
      const latinSlug = tag.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Убираем все кроме латинских букв, цифр и пробелов
        .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
        .trim();
      
      if (latinSlug && latinSlug !== tag.slug) {
        try {
          await prisma.tag.update({
            where: { id: tag.id },
            data: { slug: latinSlug }
          });
          console.log(`✅ Обновлен slug: "${tag.name}" -> "${latinSlug}"`);
        } catch (error) {
          if (error.code === 'P2002') {
            // Если slug уже существует, добавляем суффикс
            let newSlug = latinSlug;
            let counter = 1;
            while (true) {
              try {
                await prisma.tag.update({
                  where: { id: tag.id },
                  data: { slug: newSlug }
                });
                console.log(`✅ Обновлен slug: "${tag.name}" -> "${newSlug}"`);
                break;
              } catch (e) {
                if (e.code === 'P2002') {
                  newSlug = `${latinSlug}-${counter}`;
                  counter++;
                } else {
                  throw e;
                }
              }
            }
          } else {
            console.error(`❌ Ошибка обновления "${tag.name}":`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Slug исправлены!');
    
    // Показываем обновленные теги
    const updatedTags = await prisma.tag.findMany({
      select: { name: true, slug: true, promptCount: true },
      orderBy: { promptCount: 'desc' },
      take: 10
    });
    
    console.log('\n📊 Топ-10 тегов после исправления:');
    updatedTags.forEach(tag => {
      console.log(`  - ${tag.name} (slug: ${tag.slug}, count: ${tag.promptCount})`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTagSlugs();
