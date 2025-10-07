const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Обновить счётчики промптов для всех категорий
 */
async function updateCategoryCounts() {
  console.log('🔄 Updating category prompt counts...');

  try {
    // Получаем все категории
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, nameRu: true }
    });

    console.log(`Found ${categories.length} categories`);

    // Обновляем счётчики для каждой категории
    for (const category of categories) {
      const count = await prisma.prompt.count({
        where: { categoryId: category.id }
      });

      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount: count }
      });

      console.log(`✅ ${category.nameRu}: ${count} prompts`);
    }

    // Обновляем счётчики для тегов
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true }
    });

    console.log(`\n🔄 Updating tag prompt counts...`);

    for (const tag of tags) {
      const count = await prisma.promptTag.count({
        where: { tagId: tag.id }
      });

      await prisma.tag.update({
        where: { id: tag.id },
        data: { promptCount: count }
      });

      console.log(`✅ ${tag.name}: ${count} prompts`);
    }

    console.log('\n🎉 Category and tag counts updated successfully!');
  } catch (error) {
    console.error('❌ Error updating counts:', error);
    throw error;
  }
}

/**
 * Получить статистику по категориям
 */
async function getCategoryStats() {
  console.log('\n📊 Category Statistics:');
  
  const stats = await prisma.category.findMany({
    select: {
      nameRu: true,
      slug: true,
      promptCount: true,
      children: {
        select: {
          nameRu: true,
          promptCount: true
        }
      }
    },
    orderBy: { promptCount: 'desc' }
  });

  stats.forEach(category => {
    console.log(`\n📁 ${category.nameRu} (${category.slug})`);
    console.log(`   Total prompts: ${category.promptCount}`);
    
    if (category.children.length > 0) {
      console.log(`   Subcategories:`);
      category.children.forEach(child => {
        console.log(`     - ${child.nameRu}: ${child.promptCount} prompts`);
      });
    }
  });
}

/**
 * Получить статистику по тегам
 */
async function getTagStats() {
  console.log('\n🏷️ Tag Statistics:');
  
  const stats = await prisma.tag.findMany({
    select: {
      name: true,
      slug: true,
      promptCount: true,
      isNsfw: true
    },
    orderBy: { promptCount: 'desc' },
    take: 20
  });

  stats.forEach(tag => {
    const nsfwFlag = tag.isNsfw ? ' [NSFW]' : '';
    console.log(`   ${tag.name}${nsfwFlag}: ${tag.promptCount} prompts`);
  });
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'update':
      await updateCategoryCounts();
      break;
    case 'stats':
      await getCategoryStats();
      await getTagStats();
      break;
    case 'full':
      await updateCategoryCounts();
      await getCategoryStats();
      await getTagStats();
      break;
    default:
      console.log('Usage: node update-category-counts.js [update|stats|full]');
      console.log('  update - Update category and tag counts');
      console.log('  stats  - Show statistics');
      console.log('  full   - Update counts and show statistics');
      break;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
