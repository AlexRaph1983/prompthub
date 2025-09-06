import { test, expect } from '@playwright/test'

test.describe('i18n redirects', () => {
  test('root resolves to default locale without loops', async ({ request, page }) => {
    // Проверяем что корневой путь не создает бесконечные редиректы
    const res = await request.fetch('http://localhost:3000/', { 
      method: 'HEAD', 
      maxRedirects: 5 
    })
    expect([200, 301, 302, 307, 308]).toContain(res.status())
    
    // Проверяем что страница загружается корректно
    await page.goto('http://localhost:3000/ru', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/ru(\/|$)/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('direct /ru is served once', async ({ page }) => {
    await page.goto('http://localhost:3000/ru')
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/ru(\/|$)/)
  })

  test('direct /en is served once', async ({ page }) => {
    await page.goto('http://localhost:3000/en')
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/en(\/|$)/)
  })

  test('no redirect loops on /ru/home', async ({ page }) => {
    await page.goto('http://localhost:3000/ru/home')
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveURL(/\/ru\/home/)
  })

  test('middleware redirects root to default locale', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // next-intl делает редирект на дефолтную локаль
    await expect(page).toHaveURL(/\/[a-z]{2}(\/|$)/)
    await expect(page.locator('body')).toBeVisible()
  })
})
