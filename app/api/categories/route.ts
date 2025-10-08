import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем все промпты с категориями
    const prompts = await prisma.prompt.findMany({
      select: {
        category: true,
      },
    });

    // Собираем уникальные категории
    const categoryMap = new Map<string, number>();
    
    prompts.forEach(prompt => {
      if (prompt.category) {
        const count = categoryMap.get(prompt.category) || 0;
        categoryMap.set(prompt.category, count + 1);
      }
    });

    // Форматируем категории
    const formattedCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      nameRu: name,
      nameEn: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      count,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    return NextResponse.json({ error: 'Ошибка при получении категорий' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}