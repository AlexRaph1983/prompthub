import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 часа

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  
  // Clean-param для Яндекс: параметры, которые не меняют контент
  // sort, order, cursor - для сортировки/пагинации
  // utm_* - для аналитики  
  // page, limit - для пагинации (если используется)
  // q - поисковый запрос (внутренний поиск, не индексируется)
  const robotsContent = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /_next/
Disallow: /*?*q=*
Disallow: /*?*sort=*
Disallow: /*?*order=*
Disallow: /*?*cursor=*

User-agent: Yandex
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /_next/
Disallow: /*?*q=*
Disallow: /*?*sort=*
Disallow: /*?*order=*
Disallow: /*?*cursor=*
Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content&sort&order&cursor&page&limit&q

Host: ${baseUrl.replace('https://', '').replace('http://', '')}
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

