import { NextRequest, NextResponse } from 'next/server';
import { 
  SITEMAP_CONFIG, 
  XML_TEMPLATES, 
  formatLastMod,
  getCached 
} from '@/lib/sitemap';

export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

export async function GET(request: NextRequest) {
  try {
    const sitemaps = await getCached('sitemap-index', async () => {
      const now = new Date();
      const baseUrl = SITEMAP_CONFIG.BASE_URL;
      
      return [
        {
          loc: `${baseUrl}/sitemaps/root.xml`,
          lastmod: formatLastMod(now),
        },
        {
          loc: `${baseUrl}/sitemaps/ru.xml`,
          lastmod: formatLastMod(now),
        },
        {
          loc: `${baseUrl}/sitemaps/en.xml`,
          lastmod: formatLastMod(now),
        },
        {
          loc: `${baseUrl}/sitemaps/categories.xml`,
          lastmod: formatLastMod(now),
        },
        {
          loc: `${baseUrl}/sitemaps/tags.xml`,
          lastmod: formatLastMod(now),
        },
      ];
    });

    // Добавляем пагинированные карты промптов
    const promptsData = await getCached('prompts-count', async () => {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const total = await prisma.prompt.count();
      const totalPages = Math.ceil(total / SITEMAP_CONFIG.PROMPTS_PER_PAGE);
      
      await prisma.$disconnect();
      return { total, totalPages };
    });

    // Добавляем карты промптов
    for (let page = 1; page <= promptsData.totalPages; page++) {
      sitemaps.push({
        loc: `${SITEMAP_CONFIG.BASE_URL}/sitemaps/prompts-${page.toString().padStart(4, '0')}.xml`,
        lastmod: formatLastMod(new Date()),
      });
    }

    const xml = XML_TEMPLATES.sitemapIndex(sitemaps);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${SITEMAP_CONFIG.REVALIDATE_TIME}`,
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
