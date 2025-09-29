const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSunoPrompts() {
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        author: {
          name: 'SUNO Master'
        }
      },
      select: {
        title: true,
        description: true,
        tags: true,
        createdAt: true
      }
    });

    console.log('🎵 Промпты SUNO Master:');
    console.log(`📊 Всего промптов: ${prompts.length}`);
    console.log('');
    
    prompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ${prompt.title}`);
      console.log(`   Описание: ${prompt.description}`);
      console.log(`   Теги: ${prompt.tags}`);
      console.log(`   Создан: ${prompt.createdAt.toLocaleDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Ошибка при проверке промптов SUNO Master:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSunoPrompts();
