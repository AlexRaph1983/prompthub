import { NextRequest, NextResponse } from 'next/server';
import { 
  SITEMAP_CONFIG, 
  XML_TEMPLATES, 
  SITEMAP_PRIORITIES,
  formatLastMod,
  urlBuilders,
  getCached,
  getTagLastMod 
} from '@/lib/sitemap';

export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

export async function GET(request: NextRequest) {
  try {
    const urls = await getCached('tags-sitemap', async () => {
      const { priority, changefreq } = SITEMAP_PRIORITIES.tags;
      const { getSitemapData } = await import('@/lib/sitemap');
      
      const { tags } = await getSitemapData();
      const urls = [];

      for (const tag of tags) {
        const tagSlug = encodeURIComponent(tag.name);
        const lastmod = await getTagLastMod(tag.name);
        
        // Добавляем URL для каждой локали
        for (const locale of SITEMAP_CONFIG.LOCALES) {
          urls.push({
            loc: urlBuilders.tag(tag.name, locale),
            lastmod: formatLastMod(lastmod),
            changefreq,
            priority,
          });
        }
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
    console.error('Error generating tags sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
