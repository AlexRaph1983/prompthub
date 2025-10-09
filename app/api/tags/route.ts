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
        color: true,
      },
      take: 50, // Получаем больше тегов для подсчета
    });

    // Считаем промпты для каждого тега динамически
    const tagsWithCounts = await Promise.all(tags.map(async (tag) => {
      const promptCount = await prisma.prompt.count({
        where: {
          tags: {
            contains: tag.name
          }
        }
      });
      
      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        promptCount: promptCount,
        color: tag.color,
      };
    }));

    // Фильтруем теги с промптами и сортируем по количеству
    const formattedTags = tagsWithCounts
      .filter(tag => tag.promptCount > 0)
      .sort((a, b) => b.promptCount - a.promptCount)
      .slice(0, 20); // Топ 20 тегов

    return NextResponse.json(formattedTags);
  } catch (error) {
    console.error('Ошибка при получении тегов:', error);
    return NextResponse.json({ error: 'Ошибка при получении тегов' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}