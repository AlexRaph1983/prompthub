import { test, expect } from '@playwright/test';

test.describe('Categories Navigation', () => {
  test('should display category navigation on desktop', async ({ page }) => {
    await page.goto('/ru/prompts');
    
    // Проверяем наличие левого меню на десктопе
    await expect(page.locator('[data-testid="category-nav"]')).toBeVisible();
    
    // Проверяем наличие основных категорий
    await expect(page.locator('text=Промпты для юристов')).toBeVisible();
    await expect(page.locator('text=Промпты для врачей')).toBeVisible();
    await expect(page.locator('text=Промпты для обучения')).toBeVisible();
  });

  test('should show mobile drawer on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ru/prompts');
    
    // Проверяем наличие кнопки открытия меню
    await expect(page.locator('button:has-text("Категории")')).toBeVisible();
    
    // Открываем меню
    await page.click('button:has-text("Категории")');
    
    // Проверяем, что меню открылось
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Промпты для юристов')).toBeVisible();
  });

  test('should navigate to category page', async ({ page }) => {
    await page.goto('/ru/prompts');
    
    // Кликаем на категорию
    await page.click('a[href="/ru/category/legal"]');
    
    // Проверяем, что перешли на страницу категории
    await expect(page).toHaveURL('/ru/category/legal');
    await expect(page.locator('h1:has-text("Промпты для юристов")')).toBeVisible();
  });

  test('should show subcategories for Image category', async ({ page }) => {
    await page.goto('/ru/category/image');
    
    // Проверяем наличие подкатегорий
    await expect(page.locator('text=Фотосессии')).toBeVisible();
    await expect(page.locator('text=Обработка фото')).toBeVisible();
    await expect(page.locator('text=NSFW 18+')).toBeVisible();
  });

  test('should handle NSFW content warning', async ({ page }) => {
    await page.goto('/ru/category/image?nsfw=true');
    
    // Проверяем наличие предупреждения
    await expect(page.locator('text=Внимание: контент для взрослых')).toBeVisible();
    
    // Подтверждаем возраст
    await page.click('button:has-text("Мне исполнилось 18 лет")');
    
    // Проверяем, что предупреждение исчезло
    await expect(page.locator('text=Внимание: контент для взрослых')).not.toBeVisible();
  });

  test('should filter prompts by category', async ({ page }) => {
    await page.goto('/ru/category/legal');
    
    // Проверяем, что отображаются только промпты из категории Legal
    const prompts = page.locator('[data-testid="prompt-card"]');
    await expect(prompts).toHaveCount.greaterThan(0);
    
    // Проверяем, что все промпты относятся к категории Legal
    const categoryBadges = page.locator('[data-testid="prompt-category"]');
    for (let i = 0; i < await categoryBadges.count(); i++) {
      await expect(categoryBadges.nth(i)).toContainText('Legal');
    }
  });

  test('should show popular tags for category', async ({ page }) => {
    await page.goto('/ru/category/legal');
    
    // Проверяем наличие блока популярных тегов
    await expect(page.locator('text=Популярные теги')).toBeVisible();
    
    // Проверяем наличие тегов
    const tags = page.locator('[data-testid="popular-tag"]');
    await expect(tags).toHaveCount.greaterThan(0);
  });

  test('should have correct SEO metadata', async ({ page }) => {
    await page.goto('/ru/category/legal');
    
    // Проверяем title
    await expect(page).toHaveTitle(/Промпты для юристов/);
    
    // Проверяем meta description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /юридических задач/);
    
    // Проверяем hreflang
    const hreflangRu = page.locator('link[hreflang="ru"]');
    const hreflangEn = page.locator('link[hreflang="en"]');
    await expect(hreflangRu).toHaveAttribute('href', /\/ru\/category\/legal/);
    await expect(hreflangEn).toHaveAttribute('href', /\/en\/category\/legal/);
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/ru/prompts');
    
    // Проверяем ARIA атрибуты
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('nav[aria-label="Категории"]')).toBeVisible();
    
    // Проверяем навигацию с клавиатуры
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Проверяем, что фокус работает корректно
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Тестируем десктоп
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/ru/prompts');
    await expect(page.locator('[data-testid="category-nav"]')).toBeVisible();
    
    // Тестируем планшет
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('button:has-text("Категории")')).toBeVisible();
    
    // Тестируем мобильный
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('button:has-text("Категории")')).toBeVisible();
  });
});
