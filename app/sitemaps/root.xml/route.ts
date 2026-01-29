import { NextRequest, NextResponse } from 'next/server';
import { 
  SITEMAP_CONFIG, 
  XML_TEMPLATES, 
  SITEMAP_PRIORITIES,
  formatLastMod,
  getCached 
} from '@/lib/sitemap';

export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

export async function GET(request: NextRequest) {
  try {
    const urls = await getCached('root-sitemap', async () => {
      const now = new Date();
      const { priority, changefreq } = SITEMAP_PRIORITIES.root;
      
      return [
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/ru/home`,
          lastmod: formatLastMod(now),
          changefreq,
          priority,
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/ru/prompts`,
          lastmod: formatLastMod(now),
          changefreq: 'daily',
          priority: '0.9',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/ru/leaders`,
          lastmod: formatLastMod(now),
          changefreq: 'weekly',
          priority: '0.6',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/ru/privacy`,
          lastmod: formatLastMod(now),
          changefreq: 'yearly',
          priority: '0.3',
        },
        {
          loc: `${SITEMAP_CONFIG.BASE_URL}/ru/articles`,
          lastmod: formatLastMod(now),
          changefreq: 'weekly',
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
