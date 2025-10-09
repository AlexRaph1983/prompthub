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

    // Форматируем категории и считаем промпты по новому полю categoryId
    const formattedCategories = await Promise.all(categories.map(async (category) => {
      let promptCount = 0;
      
      // Считаем промпты по новому полю categoryId
      promptCount = await prisma.prompt.count({
        where: {
          categoryId: category.id
        }
      });

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