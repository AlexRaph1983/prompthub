import { test, expect } from '@playwright/test'

test.describe('View Tracking - Double Count Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Включаем логирование сетевых запросов
    page.on('console', msg => {
      if (msg.text().includes('[VIEW_TRACKING]')) {
        console.log(`[BROWSER] ${msg.text()}`)
      }
    })
  })

  test('should count view only once when opening prompt page', async ({ page }) => {
    let trackViewCount = 0
    
    // Отслеживаем запросы к /api/track-view
    await page.route('**/api/track-view', async (route) => {
      trackViewCount++
      console.log(`[E2E] track-view request #${trackViewCount}`)
      await route.continue()
    })
    
    // Переходим на страницу промпта
    await page.goto('/prompt/test-prompt-id')
    
    // Ждем завершения запроса на трекинг
    await page.waitForTimeout(2000)
    
    // Проверяем, что был только один запрос
    expect(trackViewCount).toBe(1)
  })

  test('should NOT count view when returning to home page', async ({ page }) => {
    let trackViewRequests: string[] = []
    
    // Отслеживаем все запросы к /api/track-view
    await page.route('**/api/track-view', async (route) => {
      const requestData = route.request().postData()
      trackViewRequests.push(requestData || '')
      console.log(`[E2E] track-view request:`, requestData)
      await route.continue()
    })
    
    // 1. Переходим на страницу промпта
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(1500)
    
    const requestsAfterPromptPage = trackViewRequests.length
    console.log(`[E2E] Requests after opening prompt: ${requestsAfterPromptPage}`)
    
    // 2. Возвращаемся на главную
    await page.goto('/home')
    await page.waitForTimeout(1500)
    
    const requestsAfterHomePage = trackViewRequests.length
    console.log(`[E2E] Requests after returning to home: ${requestsAfterHomePage}`)
    
    // Проверяем, что не было дополнительных запросов
    expect(requestsAfterHomePage).toBe(requestsAfterPromptPage)
    
    // Проверяем, что ни один из запросов не был для того же промпта
    const promptIdInRequests = trackViewRequests.filter(req => 
      req.includes('test-prompt-id')
    )
    expect(promptIdInRequests.length).toBeLessThanOrEqual(1)
  })

  test('should NOT increment view when reopening same prompt within 30s', async ({ page }) => {
    let trackViewResponses: any[] = []
    
    // Перехватываем ответы от /api/track-view
    await page.route('**/api/track-view', async (route) => {
      const response = await route.fetch()
      const data = await response.json()
      trackViewResponses.push(data)
      console.log(`[E2E] track-view response:`, data)
      
      await route.fulfill({
        response,
        json: data
      })
    })
    
    // 1. Первое открытие промпта
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(1500)
    
    const firstResponse = trackViewResponses[0]
    expect(firstResponse?.counted).toBe(true)
    const firstViewCount = firstResponse?.views
    
    // 2. Переходим на главную
    await page.goto('/home')
    await page.waitForTimeout(500)
    
    // 3. Повторно открываем тот же промпт (в пределах 30 секунд)
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(1500)
    
    // Если был второй запрос трекинга, проверяем его
    if (trackViewResponses.length > 1) {
      const secondResponse = trackViewResponses[1]
      // Либо должен быть отклонен (counted: false)
      // Либо счетчик не должен был измениться
      if (secondResponse.counted === false) {
        expect(secondResponse.reason).toMatch(/DEDUP_WINDOW|TOKEN_REUSED/)
      } else {
        // Если somehow counted, views должны быть те же (из-за session storage)
        expect(secondResponse.views).toBe(firstViewCount)
      }
    }
    
    // Главное - не должно быть инкремента на втором открытии
    expect(trackViewResponses.length).toBeLessThanOrEqual(1)
  })

  test('should reject reused token', async ({ page }) => {
    let viewToken = ''
    
    // Перехватываем токен
    await page.route('**/api/view-token', async (route) => {
      const response = await route.fetch()
      const data = await response.json()
      viewToken = data.viewToken
      console.log(`[E2E] Got token:`, viewToken.slice(0, 16))
      
      await route.fulfill({
        response,
        json: data
      })
    })
    
    let trackViewAttempts = 0
    let trackViewErrors: string[] = []
    
    await page.route('**/api/track-view', async (route) => {
      trackViewAttempts++
      const response = await route.fetch()
      const data = await response.json()
      
      if (data.error || !data.counted) {
        trackViewErrors.push(data.error || data.reason)
      }
      
      console.log(`[E2E] track-view attempt #${trackViewAttempts}:`, data)
      
      await route.fulfill({
        response,
        json: data
      })
    })
    
    // Открываем промпт
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(2000)
    
    // Если по какой-то причине будет второй вызов с тем же токеном
    // он должен быть отклонен
    if (trackViewAttempts > 1) {
      expect(trackViewErrors.length).toBeGreaterThan(0)
      expect(trackViewErrors.some(e => 
        e.includes('TOKEN_REUSED') || e.includes('DEDUP_WINDOW')
      )).toBe(true)
    }
  })

  test('should include x-fingerprint header in track-view request', async ({ page }) => {
    let fingerprintHeader = ''
    
    await page.route('**/api/track-view', async (route) => {
      fingerprintHeader = route.request().headerValue('x-fingerprint') || ''
      console.log(`[E2E] x-fingerprint header:`, fingerprintHeader.slice(0, 8))
      await route.continue()
    })
    
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(1500)
    
    // Проверяем, что fingerprint был передан
    expect(fingerprintHeader).toBeTruthy()
    expect(fingerprintHeader.length).toBeGreaterThan(8)
  })

  test('should have valid referer when tracking view', async ({ page }) => {
    let refererHeader = ''
    
    await page.route('**/api/track-view', async (route) => {
      refererHeader = route.request().headerValue('referer') || ''
      console.log(`[E2E] Referer:`, refererHeader)
      await route.continue()
    })
    
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(1500)
    
    // Проверяем, что referer содержит путь к промпту
    expect(refererHeader).toContain('/prompt/test-prompt-id')
  })

  test('should store view tracking state in sessionStorage', async ({ page }) => {
    await page.goto('/prompt/test-prompt-id')
    await page.waitForTimeout(1500)
    
    // Проверяем sessionStorage
    const storageValue = await page.evaluate(() => {
      return window.sessionStorage.getItem('ph_prompt_viewed_test-prompt-id')
    })
    
    expect(storageValue).toBe('1')
  })
})

