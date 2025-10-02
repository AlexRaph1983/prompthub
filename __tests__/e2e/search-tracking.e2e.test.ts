import { test, expect } from '@playwright/test'

test.describe('Search Tracking E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should track search on Enter key', async ({ page }) => {
    // Mock API call
    await page.route('**/api/search-tracking', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()
      
      expect(postData.query).toBe('test search')
      expect(postData.queryHash).toBeTruthy()
      expect(postData.resultsCount).toBeGreaterThanOrEqual(0)
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type in search input
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('test search')
    
    // Press Enter
    await searchInput.press('Enter')
    
    // Wait for API call
    await page.waitForResponse('**/api/search-tracking')
  })

  test('should track search on blur', async ({ page }) => {
    let apiCallCount = 0
    
    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type in search input
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('test search')
    
    // Click outside to trigger blur
    await page.click('body')
    
    // Wait for API call
    await page.waitForResponse('**/api/search-tracking')
    expect(apiCallCount).toBe(1)
  })

  test('should not track short queries', async ({ page }) => {
    let apiCallCount = 0
    
    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type short query
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('ab')
    await searchInput.press('Enter')
    
    // Wait a bit to ensure no API call
    await page.waitForTimeout(1000)
    expect(apiCallCount).toBe(0)
  })

  test('should not track queries with only stop words', async ({ page }) => {
    let apiCallCount = 0
    
    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type query with only stop words
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('and or the')
    await searchInput.press('Enter')
    
    // Wait a bit to ensure no API call
    await page.waitForTimeout(1000)
    expect(apiCallCount).toBe(0)
  })

  test('should normalize queries', async ({ page }) => {
    let capturedQuery = ''
    
    await page.route('**/api/search-tracking', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()
      capturedQuery = postData.query
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type query with extra spaces and mixed case
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('  HELLO    WORLD  ')
    await searchInput.press('Enter')
    
    await page.waitForResponse('**/api/search-tracking')
    expect(capturedQuery).toBe('hello world')
  })

  test('should track click on search result', async ({ page }) => {
    let apiCallCount = 0
    let capturedClick = false
    
    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData.clickedResult) {
        capturedClick = true
        expect(postData.clickedResult).toBeTruthy()
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Search for something
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    // Wait for search results
    await page.waitForResponse('**/api/search-tracking')
    
    // Click on first result if available
    const firstResult = page.locator('[data-testid="prompt-card"]').first()
    if (await firstResult.count() > 0) {
      await firstResult.click()
      await page.waitForResponse('**/api/search-tracking')
      expect(capturedClick).toBe(true)
    }
  })

  test('should handle debounce correctly', async ({ page }) => {
    let apiCallCount = 0
    
    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type multiple characters quickly
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('t')
    await searchInput.fill('te')
    await searchInput.fill('tes')
    await searchInput.fill('test')
    
    // Wait for debounce
    await page.waitForTimeout(700)
    
    // Should only make one API call due to debounce
    expect(apiCallCount).toBe(1)
  })
})
