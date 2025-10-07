const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createLatinSlugs() {
  try {
    console.log('🔧 Создаем латинские slug для всех тегов...');
    
    // Получаем все теги
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true, slug: true }
    });
    
    console.log(`📊 Найдено тегов: ${tags.length}`);
    
    for (const tag of tags) {
      // Создаем латинский slug на основе названия
      let latinSlug = tag.name
        .toLowerCase()
        .replace(/[а-яё]/g, '') // Убираем все русские буквы
        .replace(/[^a-z0-9\s]/g, '') // Убираем все кроме латинских букв, цифр и пробелов
        .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
        .trim();
      
      // Если slug пустой, создаем на основе транслитерации
      if (!latinSlug) {
        const transliteration = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        
        latinSlug = tag.name
          .toLowerCase()
          .split('')
          .map(char => transliteration[char] || char)
          .join('')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .trim();
      }
      
      // Если все еще пустой, используем ID
      if (!latinSlug) {
        latinSlug = `tag-${tag.id.slice(-8)}`;
      }
      
      if (latinSlug !== tag.slug) {
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
    
    console.log('\n✅ Все slug обновлены!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLatinSlugs();
