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
        promptCount: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Форматируем категории для совместимости
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.nameEn, // Для обратной совместимости
      nameRu: category.nameRu,
      nameEn: category.nameEn,
      slug: category.slug,
      count: category.promptCount,
      sortOrder: category.sortOrder,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    return NextResponse.json({ error: 'Ошибка при получении категорий' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}