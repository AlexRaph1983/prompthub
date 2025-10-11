import { NextRequest, NextResponse } from 'next/server';
import { 
  SITEMAP_CONFIG, 
  XML_TEMPLATES, 
  SITEMAP_PRIORITIES,
  formatLastMod,
  urlBuilders,
  generateHreflangLinks,
  getCached 
} from '@/lib/sitemap';

export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

export async function GET(request: NextRequest) {
  try {
    const urls = await getCached('root-sitemap', async () => {
      const now = new Date();
      const { priority, changefreq } = SITEMAP_PRIORITIES.root;
      
      // Главная страница (x-default)
      const homeUrl = urlBuilders.home();
      const homeHreflang = generateHreflangLinks('', SITEMAP_CONFIG.LOCALES, 'en');
      
      return [
        {
          loc: homeUrl,
          lastmod: formatLastMod(now),
          changefreq,
          priority,
          hreflang: homeHreflang,
        },
        // RU версия главной
        {
          loc: urlBuilders.home('ru'),
          lastmod: formatLastMod(now),
          changefreq,
          priority,
        },
        // EN версия главной
        {
          loc: urlBuilders.home('en'),
          lastmod: formatLastMod(now),
          changefreq,
          priority,
        },
        // Основные страницы без локали
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/prompts`,
          lastmod: formatLastMod(now),
          changefreq,
          priority: '0.8',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/add`,
          lastmod: formatLastMod(now),
          changefreq,
          priority: '0.7',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/home`,
          lastmod: formatLastMod(now),
          changefreq,
          priority: '0.9',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/leaders`,
          lastmod: formatLastMod(now),
          changefreq,
          priority: '0.6',
        },
      ];
    });

    const xml = XML_TEMPLATES.urlSet(urls);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${SITEMAP_CONFIG.REVALIDATE_TIME}`,
      },
    });
  } catch (error) {
    console.error('Error generating root sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
