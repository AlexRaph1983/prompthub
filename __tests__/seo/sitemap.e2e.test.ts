import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('SEO: sitemap.xml', () => {
  test('sitemap.xml доступен и валидный XML', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    
    // Проверяем базовую структуру XML
    expect(content).toContain('<?xml');
    expect(content).toContain('sitemapindex');
    expect(content).toContain('<sitemap>');
    expect(content).toContain('<loc>');
    expect(content).toContain('<lastmod>');
  });

  test('sitemap.xml содержит ссылки на основные карты', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    const content = await response.text();
    
    expect(content).toContain('/sitemaps/root.xml');
    expect(content).toContain('/sitemaps/ru.xml');
    expect(content).toContain('/sitemaps/en.xml');
    expect(content).toContain('/sitemaps/categories.xml');
    expect(content).toContain('/sitemaps/tags.xml');
  });

  test('sitemap для локали доступен', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/ru.xml`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/xml');
    
    const content = await response.text();
    expect(content).toContain('urlset');
    expect(content).toContain('/ru/home');
    expect(content).toContain('/ru/prompts');
  });

  test('SEO-лендинги включены в sitemap для RU', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemaps/ru.xml`);
    const content = await response.text();
    
    expect(content).toContain('/ru/marketpleys-promtov');
    expect(content).toContain('/ru/baza-promtov');
    expect(content).toContain('/ru/katalog-promtov');
    expect(content).toContain('/ru/biblioteka-promtov');
  });
});

