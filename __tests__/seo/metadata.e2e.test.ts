import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('SEO: Metadata', () => {
  test('SEO-лендинг имеет корректные meta теги', async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/marketpleys-promtov`);
    
    // Проверяем title
    const title = await page.title();
    expect(title).toContain('Маркетплейс промптов');
    
    // Проверяем meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
    
    // Проверяем canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/ru/marketpleys-promtov');
    
    // Проверяем Open Graph
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
  });

  test('Каталог промптов имеет корректные meta теги', async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/prompts`);
    
    const title = await page.title();
    expect(title).toContain('Каталог промптов');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/ru/prompts');
  });

  test('Страницы имеют hreflang для RU и EN', async ({ page }) => {
    await page.goto(`${BASE_URL}/ru/prompts`);
    
    const hreflangRu = await page.locator('link[rel="alternate"][hreflang="ru"]').getAttribute('href');
    const hreflangEn = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
    const xDefault = await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute('href');
    
    expect(hreflangRu).toBeTruthy();
    expect(hreflangEn).toBeTruthy();
    expect(xDefault).toBeTruthy();
  });
});

