const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeTags() {
  try {
    console.log('🔍 Анализируем теги в промптах...');
    
    // Получаем все промпты с тегами
    const prompts = await prisma.prompt.findMany({
      select: {
        id: true,
        title: true,
        tags: true
      }
    });
    
    console.log(`📊 Найдено промптов: ${prompts.length}`);
    
    // Собираем все уникальные теги
    const allTags = new Set();
    prompts.forEach(prompt => {
      if (prompt.tags) {
        const tags = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        tags.forEach(tag => allTags.add(tag));
      }
    });
    
    console.log(`🏷️ Уникальных тегов: ${allTags.size}`);
    console.log('📝 Список тегов:');
    Array.from(allTags).sort().forEach((tag, index) => {
      console.log(`  ${index + 1}. ${tag}`);
    });
    
    // Подсчитываем популярность тегов
    const tagCounts = {};
    prompts.forEach(prompt => {
      if (prompt.tags) {
        const tags = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    console.log('\n📈 Топ-20 популярных тегов:');
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    sortedTags.forEach(([tag, count], index) => {
      console.log(`  ${index + 1}. ${tag} (${count} промптов)`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTags();
