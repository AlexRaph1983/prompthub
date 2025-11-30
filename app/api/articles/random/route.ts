import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * API endpoint для получения случайных статей
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 3;

    // Получаем все опубликованные статьи
    const allArticles = await prisma.article.findMany({
      where: {
        status: 'published'
      },
      select: {
        id: true,
        slug: true,
        titleRu: true,
        titleEn: true,
        descriptionRu: true,
        descriptionEn: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Перемешиваем и берем первые N
    const shuffled = allArticles.sort(() => Math.random() - 0.5);
    const randomArticles = shuffled.slice(0, Math.min(limit, shuffled.length));

    return NextResponse.json(
      { articles: randomArticles },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching random articles:', error);
    return NextResponse.json(
      { error: 'Internal server error', articles: [] },
      { status: 500 }
    );
  }
}

