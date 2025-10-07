const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTags() {
  try {
    const tags = await prisma.tag.findMany({
      where: { name: { contains: 'музыка' } },
      select: { name: true, slug: true, promptCount: true }
    });
    
    console.log('Теги с "музыка":');
    tags.forEach(tag => {
      console.log(`  - ${tag.name} (slug: ${tag.slug}, count: ${tag.promptCount})`);
    });
    
    const allTags = await prisma.tag.findMany({
      select: { name: true, slug: true, promptCount: true },
      orderBy: { promptCount: 'desc' },
      take: 10
    });
    
    console.log('\nТоп-10 тегов:');
    allTags.forEach(tag => {
      console.log(`  - ${tag.name} (slug: ${tag.slug}, count: ${tag.promptCount})`);
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTags();
