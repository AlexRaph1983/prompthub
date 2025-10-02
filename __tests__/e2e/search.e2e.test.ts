import { test, expect } from '@playwright/test'

test.describe('Search Bar E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ru/home')
  })

  test('should focus on "/" hotkey', async ({ page }) => {
    await page.keyboard.press('/')
    
    const searchInput = page.locator('[role="searchbox"]')
    await expect(searchInput).toBeFocused()
  })

  test('should show suggestions and allow selection', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.fill('ambient')
    
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    
    const suggestion = page.locator('[role="option"]').first()
    await suggestion.click()
    
    await expect(searchInput).toHaveValue('ambient music')
  })

  test('should submit search on Enter', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.fill('test query')
    await searchInput.press('Enter')
    
    // Проверяем, что произошел поиск (например, изменился URL или появились результаты)
    await expect(page).toHaveURL(/.*search.*test%20query/)
  })

  test('should show popular chips when focused', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.click()
    
    await expect(page.locator('text=Популярные запросы')).toBeVisible()
    await expect(page.locator('text=ambient')).toBeVisible()
  })

  test('should clear search when clear button is clicked', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.fill('test')
    
    const clearButton = page.locator('[aria-label="Очистить поиск"]')
    await clearButton.click()
    
    await expect(searchInput).toHaveValue('')
  })

  test('should show empty state when focused', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.click()
    
    await expect(page.locator('text=Найти промпт')).toBeVisible()
    await expect(page.locator('text=Попробуйте: ambient, k-pop, регги')).toBeVisible()
  })

  test('should handle keyboard navigation in suggestions', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.fill('ambient')
    
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    
    // Навигация стрелками
    await searchInput.press('ArrowDown')
    await searchInput.press('ArrowDown')
    await searchInput.press('Enter')
    
    // Проверяем, что выбранная подсказка применилась
    await expect(searchInput).toHaveValue(/ambient/)
  })

  test('should close suggestions on Escape', async ({ page }) => {
    const searchInput = page.locator('[role="searchbox"]')
    await searchInput.fill('ambient')
    
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    
    await searchInput.press('Escape')
    
    await expect(page.locator('[role="listbox"]')).not.toBeVisible()
  })
})
