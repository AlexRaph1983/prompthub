import { NextRequest, NextResponse } from 'next/server';
import { articleRepository } from '@/lib/repositories/articleRepository';

export const dynamic = 'force-dynamic';

/**
 * API endpoint для получения статей по тегам
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tagsParam = searchParams.get('tags');
    const limitParam = searchParams.get('limit');

    if (!tagsParam) {
      return NextResponse.json(
        { error: 'Tags parameter is required' },
        { status: 400 }
      );
    }

    // Разбираем теги
    const tagSlugs = tagsParam
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    const limit = limitParam ? parseInt(limitParam, 10) : 3;

    // Получаем статьи через репозиторий
    const articles = await articleRepository.getArticlesByTags(tagSlugs, limit);

    // Возвращаем упрощенную версию данных для клиента
    const simplifiedArticles = articles.map(article => ({
      id: article.id,
      slug: article.slug,
      titleRu: article.titleRu,
      titleEn: article.titleEn,
      descriptionRu: article.descriptionRu,
      descriptionEn: article.descriptionEn,
      publishedAt: article.publishedAt?.toISOString() || null
    }));

    return NextResponse.json(
      { articles: simplifiedArticles },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching articles by tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

