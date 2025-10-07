const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMusicTag() {
  try {
    const tags = await prisma.tag.findMany({
      where: { name: 'музыка' },
      select: { name: true, slug: true, promptCount: true }
    });
    
    console.log('Тег "музыка":');
    tags.forEach(tag => {
      console.log(`  - ${tag.name} (slug: ${tag.slug}, count: ${tag.promptCount})`);
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMusicTag();
