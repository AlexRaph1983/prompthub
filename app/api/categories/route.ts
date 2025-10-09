import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем категории из новой таблицы Category
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        slug: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Маппинг старых категорий на новые slug
    const categoryMapping = {
      'Legal': 'legal',
      'Photography': 'photography', 
      'Health': 'health',
      'Photo Editing': 'photo-editing',
      'Education': 'education',
      'NSFW 18+': 'nsfw',
      'Marketing & Writing': 'marketing-writing',
      'Image': 'image',
      'Video': 'video',
      'Chat': 'chat',
      'Code': 'code',
      'SEO': 'seo',
      'Design': 'design',
      'Music': 'music',
      'Audio': 'audio',
      '3D': '3d',
      'Animation': 'animation',
      'Business': 'business'
    };

    // Создаем обратный маппинг slug -> oldCategory
    const reverseMapping = {};
    Object.entries(categoryMapping).forEach(([old, slug]) => {
      reverseMapping[slug] = old;
    });

    // Форматируем категории и считаем промпты по старому полю category
    const formattedCategories = await Promise.all(categories.map(async (category) => {
      const oldCategoryName = reverseMapping[category.slug];
      let promptCount = 0;
      
      if (oldCategoryName) {
        promptCount = await prisma.prompt.count({
          where: {
            category: oldCategoryName
          }
        });
      }

      return {
        id: category.id,
        name: category.nameEn, // Для обратной совместимости
        nameRu: category.nameRu,
        nameEn: category.nameEn,
        slug: category.slug,
        count: promptCount,
        sortOrder: category.sortOrder,
      };
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    return NextResponse.json({ error: 'Ошибка при получении категорий' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}