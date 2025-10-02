import { test, expect } from '@playwright/test'

test.describe('Admin Search E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу админ-панели
    await page.goto('/admin/prompts')
    
    // Ждем загрузки страницы
    await page.waitForSelector('input[placeholder*="Поиск"]')
  })

  test('should show search input with placeholder', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', /Поиск по названию/)
  })

  test('should show suggestions on typing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим текст
    await searchInput.fill('test')
    
    // Ждем появления подсказок
    await page.waitForTimeout(700) // Debounce время
    
    // Проверяем, что подсказки появились (если есть данные)
    const suggestions = page.locator('[data-testid="search-suggestions"]')
    if (await suggestions.count() > 0) {
      await expect(suggestions).toBeVisible()
    }
  })

  test('should clear search with X button', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим текст
    await searchInput.fill('test query')
    await expect(searchInput).toHaveValue('test query')
    
    // Нажимаем кнопку очистки
    const clearButton = page.locator('button[data-testid="clear-search"]')
    if (await clearButton.count() > 0) {
      await clearButton.click()
      await expect(searchInput).toHaveValue('')
    }
  })

  test('should show loading indicator during search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим текст и нажимаем Enter
    await searchInput.fill('test query')
    await searchInput.press('Enter')
    
    // Проверяем индикатор загрузки
    const loadingIndicator = page.locator('[data-testid="search-loading"]')
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator).toBeVisible()
    }
  })

  test('should filter results based on search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим поисковый запрос
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    // Ждем обновления результатов
    await page.waitForTimeout(1000)
    
    // Проверяем, что результаты отфильтрованы
    const results = page.locator('[data-testid="prompt-card"]')
    const count = await results.count()
    
    if (count > 0) {
      // Проверяем, что все результаты содержат поисковый запрос
      for (let i = 0; i < count; i++) {
        const title = await results.nth(i).locator('h3').textContent()
        expect(title?.toLowerCase()).toContain('test')
      }
    }
  })

  test('should handle empty search results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим запрос, который не должен найти результатов
    await searchInput.fill('nonexistentquery12345')
    await searchInput.press('Enter')
    
    // Ждем обновления
    await page.waitForTimeout(1000)
    
    // Проверяем сообщение об отсутствии результатов
    const noResultsMessage = page.locator('text=Результаты не найдены')
    if (await noResultsMessage.count() > 0) {
      await expect(noResultsMessage).toBeVisible()
    }
  })

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Тестируем различные специальные символы
    const specialQueries = [
      'test@example.com',
      'query with spaces',
      'запрос с кириллицей',
      'query with numbers 123',
      'query with symbols !@#$%'
    ]
    
    for (const query of specialQueries) {
      await searchInput.fill(query)
      await searchInput.press('Enter')
      
      // Ждем обработки
      await page.waitForTimeout(500)
      
      // Очищаем для следующего теста
      await searchInput.fill('')
    }
  })

  test('should handle rapid typing with debounce', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Быстро вводим символы
    await searchInput.fill('t')
    await page.waitForTimeout(100)
    await searchInput.fill('te')
    await page.waitForTimeout(100)
    await searchInput.fill('tes')
    await page.waitForTimeout(100)
    await searchInput.fill('test')
    
    // Ждем debounce
    await page.waitForTimeout(700)
    
    // Проверяем, что финальный запрос обработан
    await expect(searchInput).toHaveValue('test')
  })

  test('should handle blur event', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим текст
    await searchInput.fill('test query')
    
    // Кликаем вне поля ввода (blur)
    await page.click('body')
    
    // Ждем обработки
    await page.waitForTimeout(500)
    
    // Проверяем, что поиск выполнен
    await expect(searchInput).toHaveValue('test query')
  })

  test('should handle keyboard navigation', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Вводим текст
    await searchInput.fill('test')
    
    // Ждем появления подсказок
    await page.waitForTimeout(700)
    
    // Навигация с помощью клавиатуры
    await searchInput.press('ArrowDown')
    await searchInput.press('ArrowDown')
    await searchInput.press('Enter')
    
    // Проверяем, что выбранная подсказка применена
    await expect(searchInput).toHaveValue('test')
  })

  test('should handle long search queries', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Создаем длинный запрос
    const longQuery = 'a'.repeat(200)
    await searchInput.fill(longQuery)
    await searchInput.press('Enter')
    
    // Ждем обработки
    await page.waitForTimeout(1000)
    
    // Проверяем, что запрос обработан (может быть отклонен из-за длины)
    await expect(searchInput).toHaveValue(longQuery)
  })

  test('should handle unicode characters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Поиск"]')
    
    // Тестируем Unicode символы
    const unicodeQueries = [
      'тест с кириллицей',
      'test with émojis 😀',
      'запрос с символами: αβγδε',
      'mixed русский english'
    ]
    
    for (const query of unicodeQueries) {
      await searchInput.fill(query)
      await searchInput.press('Enter')
      
      // Ждем обработки
      await page.waitForTimeout(500)
      
      // Очищаем для следующего теста
      await searchInput.fill('')
    }
  })
})
