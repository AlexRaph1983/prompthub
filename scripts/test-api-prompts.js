const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiPrompts() {
  console.log('🔍 Тестируем API промптов...');
  
  try {
    // Прямой запрос к базе данных
    const directPrompts = await prisma.prompt.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        prompt: true,
        author: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('📊 Прямой запрос к БД:');
    console.log(`Найдено промптов: ${directPrompts.length}`);
    directPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. "${prompt.title}"`);
      console.log(`   Описание: ${prompt.description ? prompt.description.substring(0, 50) + '...' : 'ОТСУТСТВУЕТ'}`);
      console.log(`   Промпт: ${prompt.prompt ? prompt.prompt.substring(0, 50) + '...' : 'ОТСУТСТВУЕТ'}`);
      console.log(`   Автор: ${prompt.author?.name || 'Unknown'}`);
      console.log('');
    });
    
    // Тестируем репозиторий
    console.log('🔧 Тестируем PromptRepository...');
    const { promptRepository } = await import('./lib/repositories/promptRepository.js');
    
    const repoResult = await promptRepository.listPrompts({
      limit: 5
    });
    
    console.log('📊 Результат PromptRepository:');
    console.log(`Найдено промптов: ${repoResult.items.length}`);
    console.log(`Has more: ${repoResult.hasMore}`);
    console.log(`Next cursor: ${repoResult.nextCursor}`);
    
    repoResult.items.forEach((prompt, index) => {
      console.log(`${index + 1}. "${prompt.title}"`);
      console.log(`   Описание: ${prompt.description ? prompt.description.substring(0, 50) + '...' : 'ОТСУТСТВУЕТ'}`);
      console.log(`   Промпт: ${prompt.prompt ? prompt.prompt.substring(0, 50) + '...' : 'ОТСУТСТВУЕТ'}`);
      console.log(`   Автор: ${prompt.author || 'Unknown'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API промптов:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testApiPrompts();
