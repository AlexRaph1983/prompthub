const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findEdmPrompts() {
  try {
    console.log('🔍 Поиск EDM промптов...');
    
    const edmPrompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { title: { contains: 'EDM' } },
          { title: { contains: 'электронная' } },
          { title: { contains: 'танцевальная' } },
          { tags: { contains: 'edm' } },
          { tags: { contains: 'electronic' } }
        ]
      },
      select: {
        id: true,
        title: true,
        tags: true,
        author: { select: { name: true } }
      }
    });
    
    console.log(`📊 Найдено EDM промптов: ${edmPrompts.length}`);
    console.log('');
    
    edmPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.title}`);
      console.log(`   ID: ${prompt.id}`);
      console.log(`   Автор: ${prompt.author.name}`);
      console.log(`   Теги: ${prompt.tags}`);
      console.log('');
    });
    
    // Проверяем конкретный промпт из URL
    const specificPromptId = 'cmftyutv4001f916h1fx551bw';
    console.log(`🎯 Проверка промпта ${specificPromptId}:`);
    
    const specificPrompt = await prisma.prompt.findUnique({
      where: { id: specificPromptId },
      select: { id: true, title: true, author: { select: { name: true } } }
    });
    
    if (specificPrompt) {
      console.log(`✅ Промпт найден: ${specificPrompt.title}`);
    } else {
      console.log('❌ Промпт не найден');
      
      // Ищем похожие ID
      console.log('\n🔍 Поиск похожих ID...');
      const similarPrompts = await prisma.prompt.findMany({
        where: {
          id: { contains: 'cmftyutv' }
        },
        select: { id: true, title: true }
      });
      
      if (similarPrompts.length > 0) {
        console.log('Найдены промпты с похожим ID:');
        similarPrompts.forEach(p => console.log(`  ${p.id} - ${p.title}`));
      } else {
        console.log('Промпты с похожим ID не найдены');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findEdmPrompts();
