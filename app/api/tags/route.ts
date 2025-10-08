import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем все промпты с тегами
    const prompts = await prisma.prompt.findMany({
      select: {
        tags: true,
      },
    });

    // Собираем все теги
    const allTags: string[] = [];
    prompts.forEach(prompt => {
      if (prompt.tags) {
        // Проверяем, является ли tags массивом или строкой
        let tags: string[] = [];
        if (typeof prompt.tags === 'string') {
          // Если строка, разбиваем по запятой
          tags = prompt.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else if (Array.isArray(prompt.tags)) {
          // Если массив, используем как есть
          tags = prompt.tags.map(tag => String(tag).trim()).filter(Boolean);
        }
        allTags.push(...tags);
      }
    });

    // Считаем частоту тегов
    const tagCounts: { [key: string]: number } = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    // Сортируем по популярности
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Топ 20 тегов

    return NextResponse.json(popularTags);
  } catch (error) {
    console.error('Ошибка при получении тегов:', error);
    return NextResponse.json({ error: 'Ошибка при получении тегов' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}