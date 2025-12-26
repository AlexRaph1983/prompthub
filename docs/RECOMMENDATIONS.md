# Система рекомендаций PromptHub

## Обзор

Персонализированная система рекомендаций промптов на основе истории взаимодействий пользователя.

## Архитектура

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│  Client/UI      │────▶│  /api/recommendations │────▶│  User Profile   │
└─────────────────┘     └───────────────────┘     │  Service        │
                                │                 └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌───────────────┐         ┌───────────────────┐
                        │  Scoring      │◀────────│  PromptInteraction│
                        │  Engine       │         │  (history)        │
                        └───────────────┘         └───────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  Diversity    │
                        │  Reranking    │
                        └───────────────┘
```

## Компоненты

### 1. User Profile Service (`lib/services/userProfileService.ts`)

Строит векторный профиль пользователя на основе истории взаимодействий:

- **Сбор данных**: последние 200 взаимодействий за 90 дней
- **Веса по типу**: copy > save > like > rate > comment > open > view
- **Time decay**: экспоненциальный с half-life 14 дней
- **Кэширование**: Redis, TTL 5 минут

### 2. Interaction Service (`lib/services/interactionService.ts`)

Защита от спама и запись взаимодействий:

- **Rate limiting**: per-user-per-prompt-per-type
- **Min interval**: 2-5 секунд между одинаковыми взаимодействиями
- **Audit logging**: все действия логируются с userId

### 3. Scoring Engine

Финальный score = weighted sum:
- **Personalization (45%)**: cosine similarity между профилем и промптом
- **Popularity (25%)**: likes, saves, comments, ratings
- **Bayesian Rating (20%)**: рейтинг с учётом количества оценок
- **Freshness (10%)**: бонус свежим промптам

### 4. Diversity Reranking

Greedy selection с penalty за похожие уже выбранные промпты.

## API Endpoints

### GET /api/recommendations

Получить персонализированные рекомендации.

**Query Parameters:**
- `for` - userId (опционально, должен совпадать с сессией)
- `locale` - язык интерфейса
- `limit` - количество результатов (default: 12, max: 50)

**Response:**
```json
[
  {
    "id": "prompt-id",
    "score": 0.85,
    "prompt": {
      "id": "prompt-id",
      "title": "...",
      "views": 100,
      ...
    }
  }
]
```

**Авторизация:**
- Без `for`: рекомендации для текущего пользователя или cold-start
- С `for`: только свои рекомендации (или админ для любого)

### POST /api/interactions

Записать взаимодействие с промптом.

**Request:**
```json
{
  "promptId": "...",
  "type": "view|copy|like|save|open",
  "weight": 1.0  // опционально
}
```

**Response:**
```json
{
  "ok": true,
  "id": "interaction-id"
}
```

**Rate Limiting:**
- 429 при превышении лимита
- `rateLimited: true` в ответе

### POST /api/recommendations/events

Логирование событий для CTR метрик.

**Request:**
```json
{
  "type": "impression|click|copy",
  "promptId": "...",       // для click/copy
  "promptIds": ["..."],    // для impression
  "position": 0            // для click/copy
}
```

### GET /api/metrics

Prometheus метрики (требует `METRICS_API_TOKEN`).

## Конфигурация (ENV)

```env
# Redis для кэширования профилей и rate limiting
REDIS_URL=redis://localhost:6379

# Защита endpoint метрик
METRICS_API_TOKEN=your-secret-token

# Уровень логирования
LOG_LEVEL=info
```

## Параметры тюнинга

### Веса скоринга (`app/api/recommendations/route.ts`)

```typescript
WEIGHTS: {
  personalization: 0.45,  // Влияние профиля
  popularity: 0.25,       // Влияние популярности
  bayesian: 0.20,         // Влияние рейтинга
  freshness: 0.10,        // Бонус свежести
}
```

### Веса взаимодействий (`lib/services/userProfileService.ts`)

```typescript
PROFILE_WEIGHTS: {
  copy: 1.0,      // Копирование - самый сильный сигнал
  save: 0.9,      // Сохранение
  like: 0.8,      // Лайк
  rate: 0.7,      // Оценка
  comment: 0.6,   // Комментарий
  open: 0.3,      // Детальная страница
  view: 0.1,      // Просмотр в списке
}
```

### Rate Limits (`lib/services/interactionService.ts`)

```typescript
RATE_LIMITS: {
  view: 30,      // views/min per prompt
  copy: 10,      // copies/min per prompt
  like: 5,       // likes/min global
  save: 5,       // saves/min global
}

MIN_INTERVAL_SECONDS: {
  view: 5,       // 1 view/5sec на тот же prompt
  copy: 2,       // 1 copy/2sec на тот же prompt
}
```

## Метрики

### Prometheus

```
reco_requests_total{personalized,cache_hit}  - Количество запросов
reco_request_duration_ms{personalized}       - Latency
reco_scoring_duration_ms                     - Время скоринга
reco_impressions_total                       - Показы рекомендаций
reco_clicks_total{position}                  - Клики
reco_copies_total{position}                  - Копирования
```

### Structured Logs

```
[METRIC] reco.request
[METRIC] reco.cache_hit
[AUDIT] interaction.recorded
[AUDIT] interaction.blocked
```

## Миграции

### Индексы для PromptInteraction

```sql
-- prisma/migrations/20251227_add_interaction_indexes/migration.sql
CREATE INDEX "PromptInteraction_type_idx" ON "PromptInteraction"("type");
CREATE INDEX "PromptInteraction_createdAt_idx" ON "PromptInteraction"("createdAt");
CREATE INDEX "PromptInteraction_userId_type_createdAt_idx" ON "PromptInteraction"("userId", "type", "createdAt");
CREATE INDEX "PromptInteraction_userId_promptId_type_createdAt_idx" ON "PromptInteraction"("userId", "promptId", "type", "createdAt");
CREATE INDEX "PromptInteraction_promptId_type_idx" ON "PromptInteraction"("promptId", "type");
```

**Rollback:**
```sql
DROP INDEX IF EXISTS "PromptInteraction_type_idx";
DROP INDEX IF EXISTS "PromptInteraction_createdAt_idx";
DROP INDEX IF EXISTS "PromptInteraction_userId_type_createdAt_idx";
DROP INDEX IF EXISTS "PromptInteraction_userId_promptId_type_createdAt_idx";
DROP INDEX IF EXISTS "PromptInteraction_promptId_type_idx";
```

## Тестирование

```bash
# Unit tests
pnpm test __tests__/recommendations/

# Integration tests
pnpm test __tests__/api/recommendations.test.ts

# E2E tests
pnpm test:e2e __tests__/e2e/recommendations.e2e.test.ts
```

## Риски и ограничения

### p95 Latency

- **Cold-start**: ~50-100ms (без персонализации)
- **Personalized**: ~100-200ms (с построением профиля)
- **Cached**: ~5-10ms

### Bottlenecks

1. **Построение профиля**: O(n) по взаимодействиям + загрузка промптов
2. **Diversity reranking**: O(k²) где k = topK
3. **Redis**: single point of failure для кэша

### Рекомендации

1. Увеличить `PROFILE_CONFIG.CACHE_TTL_SECONDS` для снижения нагрузки
2. Уменьшить `CANDIDATES_LIMIT` если latency критична
3. Использовать Redis Cluster для масштабирования

## Roadmap

- [ ] A/B тестирование весов
- [ ] Content-based filtering (embeddings)
- [ ] Collaborative filtering
- [ ] Real-time profile updates (без полного перестроения)


