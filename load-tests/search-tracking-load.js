import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Кастомные метрики
const searchTrackingRate = new Rate('search_tracking_success_rate');
const searchValidationRate = new Rate('search_validation_success_rate');

// Конфигурация тестов
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Низкая нагрузка
    { duration: '5m', target: 50 },   // Средняя нагрузка
    { duration: '3m', target: 100 },   // Высокая нагрузка
    { duration: '2m', target: 200 },   // Пиковая нагрузка
    { duration: '2m', target: 0 },     // Снижение до 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% запросов < 100ms
    http_req_failed: ['rate<0.01'],   // <1% ошибок
    search_tracking_success_rate: ['rate>0.95'], // >95% успешных запросов
  },
};

// Тестовые данные
const testQueries = [
  'hello world',
  'test search',
  'проверка поиска',
  'valid query',
  'search with emoji 😀',
  '123456789',
  '!!!!!',
  'spam',
  'фон',
  'very long query with many words to test performance',
  'unicode тест',
  'mixed русский english',
  'a', // короткий
  'ab', // короткий
  'abc', // валидный
  'aaaaa', // повторяющиеся символы
];

const baseUrl = 'http://localhost:3000';

export default function() {
  const query = testQueries[Math.floor(Math.random() * testQueries.length)];
  
  // Тест 1: Отправка поискового запроса
  const searchPayload = {
    query: query,
    resultsCount: Math.floor(Math.random() * 100),
    sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
    finished: true
  };

  const searchResponse = http.post(`${baseUrl}/api/search-tracking`, 
    JSON.stringify(searchPayload),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'search-tracking' }
    }
  );

  const searchSuccess = check(searchResponse, {
    'search tracking status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'search tracking response time < 100ms': (r) => r.timings.duration < 100,
  });

  searchTrackingRate.add(searchSuccess);

  // Тест 2: Получение метрик (только для 10% запросов)
  if (Math.random() < 0.1) {
    const metricsResponse = http.get(`${baseUrl}/api/admin/search-metrics`, {
      tags: { endpoint: 'search-metrics' }
    });

    const metricsSuccess = check(metricsResponse, {
      'metrics status is 200': (r) => r.status === 200,
      'metrics response time < 50ms': (r) => r.timings.duration < 50,
    });

    searchValidationRate.add(metricsSuccess);
  }

  sleep(0.1); // 100ms пауза между запросами
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
