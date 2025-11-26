const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCount() {
  try {
    const promptMaster = await prisma.user.findFirst({
      where: { name: 'PromptMaster' }
    });
    
    if (!promptMaster) {
      console.log('Пользователь PromptMaster не найден');
      return;
    }
    
    const count = await prisma.prompt.count({
      where: { authorId: promptMaster.id }
    });
    
    console.log(`Всего промптов от PromptMaster: ${count}`);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCount();

