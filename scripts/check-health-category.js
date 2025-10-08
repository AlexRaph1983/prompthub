const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHealthCategory() {
  try {
    console.log('🔍 Проверяем категорию health...');
    
    // Найдем категорию health
    const healthCategory = await prisma.category.findFirst({
      where: { slug: 'health' }
    });
    
    if (healthCategory) {
      console.log('Категория health найдена:');
      console.log('  - ID:', healthCategory.id);
      console.log('  - NameRu:', healthCategory.nameRu);
      console.log('  - Slug:', healthCategory.slug);
      console.log('  - PromptCount:', healthCategory.promptCount);
      
      // Проверим промпты в этой категории
      const prompts = await prisma.prompt.findMany({
        where: { categoryId: healthCategory.id },
        select: { id: true, title: true, category: true }
      });
      
      console.log(`\nПромпты в категории health: ${prompts.length}`);
      prompts.forEach(p => {
        console.log(`  - ${p.title} (старая категория: ${p.category})`);
      });
    } else {
      console.log('Категория health не найдена');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHealthCategory();
