const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMissingCategories() {
  const categoriesToCreate = [
    {
      slug: 'marketing',
      nameRu: 'Маркетинг',
      nameEn: 'Marketing',
      descriptionRu: 'Промпты для маркетинга и продвижения',
      descriptionEn: 'Marketing and promotion prompts',
      sortOrder: 0
    },
    {
      slug: 'music',
      nameRu: 'Музыка',
      nameEn: 'Music',
      descriptionRu: 'Промпты для создания музыки',
      descriptionEn: 'Music creation prompts',
      sortOrder: 0
    },
    {
      slug: '3d',
      nameRu: '3D',
      nameEn: '3D',
      descriptionRu: 'Промпты для 3D моделирования и дизайна',
      descriptionEn: '3D modeling and design prompts',
      sortOrder: 0
    },
    {
      slug: 'cooking',
      nameRu: 'Кулинария',
      nameEn: 'Cooking',
      descriptionRu: 'Промпты для кулинарии и рецептов',
      descriptionEn: 'Cooking and recipe prompts',
      sortOrder: 0
    }
  ];

  console.log('🔍 Проверяем существующие категории...\n');

  for (const catData of categoriesToCreate) {
    const existing = await prisma.category.findFirst({
      where: { slug: catData.slug }
    });

    if (existing) {
      console.log(`⏭️  Категория "${catData.nameRu}" уже существует (${catData.slug})`);
    } else {
      const created = await prisma.category.create({
        data: {
          ...catData,
          isActive: true,
          promptCount: 0
        }
      });
      console.log(`✅ Создана категория: ${created.nameRu} (${created.slug})`);
    }
  }

  console.log('\n🎉 Проверка категорий завершена!');
  await prisma.$disconnect();
}

createMissingCategories()
  .catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });

