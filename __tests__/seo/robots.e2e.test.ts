import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('SEO: robots.txt', () => {
  test('robots.txt доступен и содержит правильные директивы', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    
    const content = await response.text();
    
    // Проверяем наличие основных директив
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
    expect(content).toContain('Sitemap:');
    expect(content).toContain('sitemap.xml');
    
    // Проверяем Clean-param для Яндекс
    expect(content).toContain('Clean-param:');
    expect(content).toContain('utm_');
    expect(content).toContain('sort');
    expect(content).toContain('order');
  });

  test('robots.txt содержит Host директиву', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    const content = await response.text();
    
    expect(content).toContain('Host:');
  });

  test('robots.txt блокирует служебные пути', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    const content = await response.text();
    
    expect(content).toContain('Disallow: /api/');
    expect(content).toContain('Disallow: /admin/');
    expect(content).toContain('Disallow: /dashboard/');
  });
});

