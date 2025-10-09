import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем теги из таблицы Tag
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        promptCount: true,
        color: true,
      },
      orderBy: {
        promptCount: 'desc',
      },
      take: 20, // Топ 20 тегов
    });

    // Форматируем теги для совместимости
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      promptCount: tag.promptCount,
      color: tag.color,
    }));

    return NextResponse.json(formattedTags);
  } catch (error) {
    console.error('Ошибка при получении тегов:', error);
    return NextResponse.json({ error: 'Ошибка при получении тегов' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}