const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTagTest() {
  try {
    console.log('Checking tag "test"...');
    
    const tag = await prisma.tag.findUnique({
      where: { slug: 'test' }
    });
    
    console.log('Tag data:', tag);
    
    // Проверяем промпты с тегом "test"
    const prompts = await prisma.prompt.findMany({
      where: {
        tags: {
          contains: 'test'
        }
      },
      select: {
        id: true,
        title: true,
        tags: true
      }
    });
    
    console.log(`Found ${prompts.length} prompts with tag "test":`);
    prompts.forEach(p => {
      console.log(`- ${p.title} (tags: ${p.tags})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTagTest();
