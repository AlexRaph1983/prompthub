import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  SITEMAP_CONFIG,
  XML_NAMESPACES,
  formatLastMod,
  buildCanonicalUrl,
  generateHreflangLinks,
  XML_TEMPLATES,
  type Locale
} from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

/**
 * Генерация sitemap для статей
 */
export async function GET() {
  try {
    // Получаем все опубликованные статьи
    const articles = await prisma.article.findMany({
      where: {
        status: 'published'
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Генерируем URL для каждой статьи на всех языках
    const urls = articles.flatMap(article => {
      return SITEMAP_CONFIG.LOCALES.map(locale => {
        const url = buildCanonicalUrl(`/articles/${article.slug}`, locale);
        const hreflangLinks = generateHreflangLinks(
          `/articles/${article.slug}`,
          SITEMAP_CONFIG.LOCALES as unknown as Locale[],
          'ru'
        );

        return {
          loc: url,
          lastmod: formatLastMod(article.updatedAt || article.publishedAt || new Date()),
          changefreq: 'monthly',
          priority: '0.7',
          hreflang: hreflangLinks
        };
      });
    });

    // Добавляем главную страницу списка статей
    SITEMAP_CONFIG.LOCALES.forEach(locale => {
      const url = buildCanonicalUrl('/articles', locale);
      const hreflangLinks = generateHreflangLinks(
        '/articles',
        SITEMAP_CONFIG.LOCALES as unknown as Locale[],
        'ru'
      );

      urls.unshift({
        loc: url,
        lastmod: formatLastMod(new Date()),
        changefreq: 'weekly',
        priority: '0.8',
        hreflang: hreflangLinks
      });
    });

    const xml = XML_TEMPLATES.urlSet(urls);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, s-maxage=${SITEMAP_CONFIG.REVALIDATE_TIME}, stale-while-revalidate`
      }
    });
  } catch (error) {
    console.error('Error generating articles sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

