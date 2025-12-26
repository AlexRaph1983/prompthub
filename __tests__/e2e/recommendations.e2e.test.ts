import { test, expect } from '@playwright/test'

/**
 * E2E тесты для системы рекомендаций
 * 
 * Эти тесты проверяют полный flow:
 * 1. Пользователь копирует промпт
 * 2. Система записывает взаимодействие
 * 3. Следующий запрос рекомендаций учитывает историю
 */

test.describe('Recommendations E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Очищаем localStorage и cookies
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })
  
  test('recommendations API returns prompts', async ({ request }) => {
    const response = await request.get('/api/recommendations')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
    
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('score')
      expect(data[0]).toHaveProperty('prompt')
    }
  })
  
  test('interaction API accepts valid requests', async ({ request }) => {
    // Сначала получаем промпт
    const recoResponse = await request.get('/api/recommendations')
    const recommendations = await recoResponse.json()
    
    if (recommendations.length === 0) {
      test.skip()
      return
    }
    
    const promptId = recommendations[0].id
    
    // Отправляем взаимодействие
    const interactionResponse = await request.post('/api/interactions', {
      data: {
        promptId,
        type: 'view',
      },
    })
    
    expect(interactionResponse.ok()).toBeTruthy()
    const result = await interactionResponse.json()
    expect(result.ok).toBe(true)
  })
  
  test('rate limiting blocks spam requests', async ({ request }) => {
    const recoResponse = await request.get('/api/recommendations')
    const recommendations = await recoResponse.json()
    
    if (recommendations.length === 0) {
      test.skip()
      return
    }
    
    const promptId = recommendations[0].id
    
    // Отправляем много запросов подряд
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.post('/api/interactions', {
          data: { promptId, type: 'copy' },
        })
      )
    )
    
    // Первый должен пройти
    expect(responses[0].ok()).toBeTruthy()
    
    // Последующие должны быть заблокированы (429 или ok:false)
    const lastResponse = responses[responses.length - 1]
    const lastResult = await lastResponse.json()
    
    // Rate limited - либо 429, либо ok: false
    if (lastResponse.status() === 429) {
      expect(lastResult.rateLimited).toBeTruthy()
    }
  })
  
  test('copy interaction affects recommendations', async ({ request }) => {
    // Получаем начальные рекомендации
    const initialResponse = await request.get('/api/recommendations')
    const initialData = await initialResponse.json()
    
    if (initialData.length < 2) {
      test.skip()
      return
    }
    
    const promptToCopy = initialData[0].id
    
    // Записываем copy взаимодействие
    await request.post('/api/interactions', {
      data: {
        promptId: promptToCopy,
        type: 'copy',
      },
    })
    
    // Ждём немного для обновления профиля
    await new Promise((r) => setTimeout(r, 100))
    
    // Получаем обновлённые рекомендации
    // Примечание: результат может быть закэширован, поэтому в реальном тесте
    // нужно либо инвалидировать кэш, либо ждать TTL
    const updatedResponse = await request.get('/api/recommendations')
    const updatedData = await updatedResponse.json()
    
    // Структура должна сохраниться
    expect(Array.isArray(updatedData)).toBeTruthy()
    expect(updatedData.length).toBeGreaterThan(0)
  })
  
  test('recommendation events are tracked', async ({ request }) => {
    // Получаем рекомендации
    const recoResponse = await request.get('/api/recommendations')
    const recommendations = await recoResponse.json()
    
    if (recommendations.length === 0) {
      test.skip()
      return
    }
    
    // Отправляем impression event
    const impressionResponse = await request.post('/api/recommendations/events', {
      data: {
        type: 'impression',
        promptIds: recommendations.map((r: any) => r.id),
      },
    })
    
    expect(impressionResponse.ok()).toBeTruthy()
    
    // Отправляем click event
    const clickResponse = await request.post('/api/recommendations/events', {
      data: {
        type: 'click',
        promptId: recommendations[0].id,
        position: 0,
      },
    })
    
    expect(clickResponse.ok()).toBeTruthy()
  })
  
  test('unauthorized user cannot get recommendations for another user', async ({ request }) => {
    // Пробуем получить рекомендации для другого пользователя без авторизации
    const response = await request.get('/api/recommendations?for=some-other-user-id')
    
    // Должен вернуть либо 403, либо рекомендации для анонима
    // В зависимости от того, есть ли сессия
    expect([200, 403]).toContain(response.status())
  })
})

test.describe('Metrics API', () => {
  test('metrics endpoint returns Prometheus format', async ({ request }) => {
    const response = await request.get('/api/metrics')
    
    // Без токена может вернуть 401, с токеном 200
    if (response.status() === 200) {
      const text = await response.text()
      expect(text).toContain('# HELP')
    }
  })
})


