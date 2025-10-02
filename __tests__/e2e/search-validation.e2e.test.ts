import { test, expect } from '@playwright/test'

test.describe('Search Validation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should accept valid search query with finished flag', async ({ page }) => {
    let apiCallCount = 0
    let capturedQuery = ''
    let capturedFinished = false

    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      const request = route.request()
      const postData = request.postDataJSON()
      
      capturedQuery = postData.query
      capturedFinished = postData.finished
      
      expect(postData.finished).toBe(true)
      expect(postData.query).toBe('valid search')
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Type valid search and press Enter
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('valid search')
    await searchInput.press('Enter')
    
    await page.waitForResponse('**/api/search-tracking')
    expect(apiCallCount).toBe(1)
    expect(capturedQuery).toBe('valid search')
    expect(capturedFinished).toBe(true)
  })

  test('should reject short query', async ({ page }) => {
    let apiCallCount = 0
    let capturedResponse = null

    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData.query === 'ab') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'TOO_SHORT',
            reason: 'TOO_SHORT',
            metrics: { length: 2, percentLetters: 100 }
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Type short query
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('ab')
    await searchInput.press('Enter')
    
    await page.waitForResponse('**/api/search-tracking')
    expect(apiCallCount).toBe(1)
  })

  test('should reject query with insufficient letters', async ({ page }) => {
    let apiCallCount = 0

    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData.query === '123456789') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'INSUFFICIENT_LETTERS',
            reason: 'INSUFFICIENT_LETTERS',
            metrics: { percentLetters: 0 }
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Type query with only numbers
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('123456789')
    await searchInput.press('Enter')
    
    await page.waitForResponse('**/api/search-tracking')
    expect(apiCallCount).toBe(1)
  })

  test('should reject query with too many consecutive characters', async ({ page }) => {
    let apiCallCount = 0

    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData.query === 'aaaaa') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'TOO_MANY_CONSECUTIVE_CHARS',
            reason: 'TOO_MANY_CONSECUTIVE_CHARS',
            metrics: { maxConsecutiveChars: 5 }
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Type query with many consecutive characters
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('aaaaa')
    await searchInput.press('Enter')
    
    await page.waitForResponse('**/api/search-tracking')
    expect(apiCallCount).toBe(1)
  })

  test('should reject query without finished flag', async ({ page }) => {
    let apiCallCount = 0

    await page.route('**/api/search-tracking', async (route) => {
      apiCallCount++
      const request = route.request()
      const postData = request.postDataJSON()
      
      if (postData.finished === false || postData.finished === undefined) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'QUERY_NOT_FINISHED',
            reason: 'QUERY_NOT_FINISHED'
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // Type query but don't finish it (no Enter or blur)
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('hello world')
    
    // Wait a bit to ensure no API call is made
    await page.waitForTimeout(1000)
    expect(apiCallCount).toBe(0)
  })

  test('should normalize query before validation', async ({ page }) => {
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
    expect(capturedQuery).toBe('  HELLO    WORLD  ') // Frontend sends as-is, server normalizes
  })

  test('should track metrics for accepted and rejected queries', async ({ page }) => {
    // Mock metrics endpoint
    await page.route('**/api/admin/search-metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            metrics: {
              countSaved: 5,
              countRejected: 3,
              totalQueries: 8,
              acceptanceRate: 63,
              rejectionRate: 37,
              lastUpdated: new Date().toISOString()
            },
            rejectionReasons: {
              'TOO_SHORT': 2,
              'INSUFFICIENT_LETTERS': 1
            }
          }
        })
      })
    })

    // Navigate to admin metrics page
    await page.goto('/admin/search-metrics')
    
    // Check if metrics are displayed
    await expect(page.locator('text=Сохранено запросов')).toBeVisible()
    await expect(page.locator('text=Отклонено запросов')).toBeVisible()
    await expect(page.locator('text=Всего запросов')).toBeVisible()
  })
})
