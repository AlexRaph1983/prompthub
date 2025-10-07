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
  { params }: { params: { locale: string } }
) {
  try {
    const locale = params.locale as Locale;
    
    if (!SITEMAP_CONFIG.LOCALES.includes(locale)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const urls = await getCached(`locale-sitemap-${locale}`, async () => {
      const now = new Date();
      const { priority, changefreq } = SITEMAP_PRIORITIES.root;
      
      return [
        {
          loc: urlBuilders.home(locale),
          lastmod: formatLastMod(now),
          changefreq,
          priority,
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
    console.error(`Error generating ${params.locale} sitemap:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
