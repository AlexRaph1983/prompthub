import { test, expect } from '@playwright/test';

const BASE_URL = 'https://prompt-hub.site';

test.describe('Sitemap E2E Tests', () => {
  test('robots.txt should be accessible and valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    
    const content = await response.text();
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Disallow: /api/');
    expect(content).toContain('Disallow: /admin/');
    expect(content).toContain('Disallow: /dashboard/');
    expect(content).toContain('Sitemap: https://prompt-hub.site/sitemap.xml');
    expect(content).toContain('Host: prompt-hub.site');
    expect(content).toContain('Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content');
  });

  test('sitemap index should be accessible and valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<sitemapindex');
    expect(content).toContain('</sitemapindex>');
    expect(content).toContain('/sitemaps/root.xml');
    expect(content).toContain('/sitemaps/ru.xml');
    expect(content).toContain('/sitemaps/en.xml');
    expect(content).toContain('/sitemaps/categories.xml');
    expect(content).toContain('/sitemaps/tags.xml');
  });

  test('root sitemap should be accessible and valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/root.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');
    expect(content).toContain('</urlset>');
    expect(content).toContain('https://prompt-hub.site');
    expect(content).toContain('https://prompt-hub.site/ru');
    expect(content).toContain('https://prompt-hub.site/en');
    expect(content).toContain('hreflang="x-default"');
  });

  test('locale sitemaps should be accessible', async ({ request }) => {
    for (const locale of ['ru', 'en']) {
      const response = await request.get(`${BASE_URL}/sitemaps/${locale}.xml`);
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/xml');
      
      const content = await response.text();
      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain(`https://prompt-hub.site/${locale}`);
    }
  });

  test('categories sitemap should be accessible and valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/categories.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');
    expect(content).toContain('</urlset>');
    expect(content).toContain('/category/');
    expect(content).toContain('hreflang="ru"');
    expect(content).toContain('hreflang="en"');
    expect(content).toContain('hreflang="x-default"');
  });

  test('tags sitemap should be accessible and valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/tags.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');
    expect(content).toContain('</urlset>');
    expect(content).toContain('/tag/');
    expect(content).toContain('hreflang="ru"');
    expect(content).toContain('hreflang="en"');
    expect(content).toContain('hreflang="x-default"');
  });

  test('prompts sitemap should be accessible and valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/prompts-0001.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');
    expect(content).toContain('</urlset>');
    expect(content).toContain('/prompt/');
    expect(content).toContain('hreflang="ru"');
    expect(content).toContain('hreflang="en"');
    expect(content).toContain('hreflang="x-default"');
  });

  test('sitemap should not contain private routes', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    const content = await response.text();
    
    // Проверяем, что приватные маршруты не включены
    expect(content).not.toContain('/api/');
    expect(content).not.toContain('/admin/');
    expect(content).not.toContain('/dashboard/');
    expect(content).not.toContain('/signin');
    expect(content).not.toContain('/signup');
    expect(content).not.toContain('/settings');
  });

  test('sitemap should have proper XML structure', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/root.xml`);
    const content = await response.text();
    
    // Проверяем XML структуру
    expect(content).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(content).toContain('<urlset');
    expect(content).toContain('</urlset>');
    expect(content).toContain('<url>');
    expect(content).toContain('</url>');
    expect(content).toContain('<loc>');
    expect(content).toContain('<lastmod>');
    expect(content).toContain('<changefreq>');
    expect(content).toContain('<priority>');
  });

  test('sitemap should have proper hreflang structure', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/root.xml`);
    const content = await response.text();
    
    // Проверяем hreflang структуру
    expect(content).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(content).toContain('<xhtml:link rel="alternate"');
    expect(content).toContain('hreflang="ru"');
    expect(content).toContain('hreflang="en"');
    expect(content).toContain('hreflang="x-default"');
  });

  test('sitemap should have valid lastmod dates', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/root.xml`);
    const content = await response.text();
    
    // Проверяем формат дат ISO 8601
    const lastmodRegex = /<lastmod>(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)<\/lastmod>/;
    const matches = content.match(lastmodRegex);
    expect(matches).toBeTruthy();
    
    if (matches) {
      const date = new Date(matches[1]);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    }
  });
});
