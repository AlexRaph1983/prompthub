import { NextRequest, NextResponse } from 'next/server';
import { 
  SITEMAP_CONFIG, 
  XML_TEMPLATES, 
  SITEMAP_PRIORITIES,
  formatLastMod,
  urlBuilders,
  generateHreflangLinks,
  getCached,
  getPromptsPage,
  generateSlug 
} from '@/lib/sitemap';

export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME;

export async function GET(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const page = parseInt(params.page, 10);
    
    if (isNaN(page) || page < 1) {
      return new NextResponse('Invalid page number', { status: 400 });
    }

    const urls = await getCached(`prompts-sitemap-${page}`, async () => {
      const { priority, changefreq } = SITEMAP_PRIORITIES.prompts;
      
      const { prompts } = await getPromptsPage(page, SITEMAP_CONFIG.PROMPTS_PER_PAGE);
      const urls = [];

      for (const prompt of prompts) {
        const promptSlug = generateSlug(prompt.title);
        
        // Генерируем hreflang для промпта
        const hreflang = generateHreflangLinks(`/prompt/${promptSlug}`, SITEMAP_CONFIG.LOCALES, 'en');
        
        // Добавляем URL для каждой локали
        for (const locale of SITEMAP_CONFIG.LOCALES) {
          urls.push({
            loc: urlBuilders.prompt(promptSlug, locale),
            lastmod: formatLastMod(prompt.updatedAt),
            changefreq,
            priority,
            hreflang: locale === 'en' ? hreflang : undefined, // hreflang только для первой записи
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
    console.error(`Error generating prompts sitemap page ${params.page}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
