import { NextRequest, NextResponse } from 'next/server';
import { SITEMAP_CONFIG } from '@/lib/sitemap';

export const revalidate = false; // Статический файл

export async function GET(request: NextRequest) {
  const robotsTxt = `User-agent: *
Allow: /

# Запрещаем служебные разделы
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /signin
Disallow: /signup
Disallow: /settings
Disallow: /auth/
Disallow: /_next/
Disallow: /_vercel/

# Запрещаем поисковые страницы с параметрами
Disallow: /*?q=*
Disallow: /*?*utm_*
Disallow: /*?*search=*
Disallow: /*?*filter=*
Disallow: /*?*sort=*

# Разрешаем статические ресурсы
Allow: /_next/static/
Allow: /public/
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /sitemaps/

# Яндекс-специфика
Host: ${SITEMAP_CONFIG.BASE_URL.replace('https://', '')}
Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content /

# Sitemap
Sitemap: ${SITEMAP_CONFIG.BASE_URL}/sitemap.xml

# Дополнительные sitemap карты
Sitemap: ${SITEMAP_CONFIG.BASE_URL}/sitemaps/root.xml
Sitemap: ${SITEMAP_CONFIG.BASE_URL}/sitemaps/ru.xml
Sitemap: ${SITEMAP_CONFIG.BASE_URL}/sitemaps/en.xml
Sitemap: ${SITEMAP_CONFIG.BASE_URL}/sitemaps/categories.xml
Sitemap: ${SITEMAP_CONFIG.BASE_URL}/sitemaps/tags.xml`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24 часа
    },
  });
}
