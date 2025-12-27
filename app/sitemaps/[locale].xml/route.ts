import { NextRequest, NextResponse } from 'next/server';
import { 
  SITEMAP_CONFIG, 
  XML_TEMPLATES, 
  SITEMAP_PRIORITIES,
  formatLastMod,
  urlBuilders,
  getCached,
  type Locale 
} from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale: localeParam } = await params;
    const locale = localeParam as Locale;
    
    if (!SITEMAP_CONFIG.LOCALES.includes(locale)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const urls = await getCached(`locale-sitemap-${locale}`, async () => {
      const now = new Date();
      const { priority, changefreq } = SITEMAP_PRIORITIES.root;
      
      const urls = [
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/${locale}/home`,
          lastmod: formatLastMod(now),
          changefreq,
          priority,
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/${locale}/prompts`,
          lastmod: formatLastMod(now),
          changefreq: 'daily',
          priority: '0.9',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/${locale}/leaders`,
          lastmod: formatLastMod(now),
          changefreq: 'weekly',
          priority: '0.6',
        },
      ];
      
      // Добавляем SEO-лендинги только для RU
      if (locale === 'ru') {
        urls.push(
          {
            loc: `${SITEMAP_CONFIG.BASE_URL}/ru/marketpleys-promtov`,
            lastmod: formatLastMod(now),
            changefreq: 'monthly',
            priority: '0.8',
          },
          {
            loc: `${SITEMAP_CONFIG.BASE_URL}/ru/baza-promtov`,
            lastmod: formatLastMod(now),
            changefreq: 'monthly',
            priority: '0.8',
          },
          {
            loc: `${SITEMAP_CONFIG.BASE_URL}/ru/katalog-promtov`,
            lastmod: formatLastMod(now),
            changefreq: 'monthly',
            priority: '0.8',
          },
          {
            loc: `${SITEMAP_CONFIG.BASE_URL}/ru/biblioteka-promtov`,
            lastmod: formatLastMod(now),
            changefreq: 'monthly',
            priority: '0.8',
          }
        );
      }
      
      return urls;
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
    const { locale: localeParam } = await params;
    console.error(`Error generating ${localeParam} sitemap:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
