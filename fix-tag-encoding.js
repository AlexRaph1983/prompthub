const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTagEncoding() {
  try {
    console.log('Fixing tag encoding issues...');
    
    // Обновляем описание тега test
    await prisma.tag.update({
      where: { slug: 'test' },
      data: { 
        description: 'Промпты с тегом test'
      }
    });
    
    console.log('Updated test tag description');
    
    // Проверяем другие теги с проблемами кодировки
    const tags = await prisma.tag.findMany({
      where: {
        description: {
          contains: 'Рџ'
        }
      }
    });
    
    console.log(`Found ${tags.length} tags with encoding issues`);
    
    for (const tag of tags) {
      const newDescription = `Промпты с тегом ${tag.name}`;
      await prisma.tag.update({
        where: { id: tag.id },
        data: { description: newDescription }
      });
      console.log(`Fixed description for tag: ${tag.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTagEncoding();
