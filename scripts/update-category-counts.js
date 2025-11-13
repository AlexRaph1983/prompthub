const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Обновить счётчики промптов для всех категорий
 * Использует groupBy для эффективного подсчёта
 */
async function updateCategoryCounts() {
  console.log('🔄 Updating category prompt counts...');

  try {
    // Шаг 1: Обнуляем все счётчики категорий
    const resetResult = await prisma.category.updateMany({
      data: { promptCount: 0 }
    });
    console.log(`Reset ${resetResult.count} category counters to 0`);

    // Шаг 2: Группируем промпты по categoryId (эффективный одиночный запрос)
    const groupedPrompts = await prisma.prompt.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: {
        categoryId: { not: null }
      }
    });

    console.log(`Found ${groupedPrompts.length} categories with prompts`);

    // Шаг 3: Обновляем счётчики батчем в транзакции
    if (groupedPrompts.length > 0) {
      await prisma.$transaction(
        groupedPrompts
          .filter(g => g.categoryId !== null)
          .map(g =>
            prisma.category.update({
              where: { id: g.categoryId },
              data: { promptCount: g._count._all }
            })
          )
      );

      // Показываем топ-10 категорий
      const topCategories = await prisma.category.findMany({
        select: { nameRu: true, promptCount: true },
        orderBy: { promptCount: 'desc' },
        take: 10
      });

      console.log('\n📊 Top 10 categories:');
      topCategories.forEach(cat => {
        console.log(`✅ ${cat.nameRu}: ${cat.promptCount} prompts`);
      });
    }

    // Обновляем счётчики для тегов (аналогично оптимизировано)
    console.log(`\n🔄 Updating tag prompt counts...`);

    // Обнуляем счётчики тегов
    await prisma.tag.updateMany({
      data: { promptCount: 0 }
    });

    // Группируем связи промптов с тегами
    const groupedTags = await prisma.promptTag.groupBy({
      by: ['tagId'],
      _count: { _all: true }
    });

    console.log(`Found ${groupedTags.length} tags with prompts`);

    // Обновляем счётчики тегов батчем
    if (groupedTags.length > 0) {
      await prisma.$transaction(
        groupedTags.map(g =>
          prisma.tag.update({
            where: { id: g.tagId },
            data: { promptCount: g._count._all }
          })
        )
      );

      // Показываем топ-10 тегов
      const topTags = await prisma.tag.findMany({
        select: { name: true, promptCount: true },
        orderBy: { promptCount: 'desc' },
        take: 10
      });

      console.log('\n🏷️ Top 10 tags:');
      topTags.forEach(tag => {
        console.log(`✅ ${tag.name}: ${tag.promptCount} prompts`);
      });
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
