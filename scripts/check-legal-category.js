const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLegalCategory() {
  try {
    console.log('🔍 Проверяем категорию legal...');
    
    // Найдем категорию legal
    const legalCategory = await prisma.category.findFirst({
      where: { slug: 'legal' }
    });
    
    if (legalCategory) {
      console.log('Категория legal найдена:');
      console.log('  - ID:', legalCategory.id);
      console.log('  - NameRu:', legalCategory.nameRu);
      console.log('  - Slug:', legalCategory.slug);
      console.log('  - PromptCount:', legalCategory.promptCount);
      
      // Проверим промпты в этой категории
      const prompts = await prisma.prompt.findMany({
        where: { categoryId: legalCategory.id },
        select: { id: true, title: true, category: true }
      });
      
      console.log(`\nПромпты в категории legal: ${prompts.length}`);
      prompts.forEach(p => {
        console.log(`  - ${p.title} (старая категория: ${p.category})`);
      });
    } else {
      console.log('Категория legal не найдена');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLegalCategory();
