# Инструкция по деплою исправлений системы просмотров

## Быстрый старт

### 1. Проверка перед деплоем

```bash
# Запустить линтер
npm run lint

# Запустить unit-тесты
npm test __tests__/track-view.test.ts

# Запустить E2E тесты (опционально, требует запущенного приложения)
npx playwright test __tests__/e2e/view-tracking.spec.ts
```

### 2. Проверка зависимостей

Убедитесь, что Redis запущен и доступен:

```bash
# Локально
redis-cli ping
# Должен вернуть: PONG

# На сервере
ssh root@83.166.244.71 "redis-cli ping"
```

### 3. Деплой на production

```bash
# Используйте стандартную процедуру деплоя из workspace rules
cd /root/prompthub && \
git fetch origin && \
git reset --hard origin/main && \
bash scripts/deploy.sh
```

**ВАЖНО:** Не запускайте migrate/seed скрипты в проде!

### 4. Проверка после деплоя

#### A. Проверка логов
```bash
# SSH на сервер
ssh root@83.166.244.71

# Проверить логи PM2
pm2 logs prompthub --lines 50 | grep TRACK-VIEW

# Должны видеть логи вида:
# [TRACK-VIEW:abc12345] API called
# [TRACK-VIEW:abc12345] Processing
# [TRACK-VIEW:abc12345] Views incremented
```

#### B. Smoke test на production
```bash
# 1. Получить токен
curl -X POST https://prompt-hub.site/api/view-token \
  -H 'Content-Type: application/json' \
  --data '{"cardId":"<EXISTING_PROMPT_ID>","fingerprint":"smoke-test-fp"}' \
  | jq .

# Ожидаемый ответ:
# {
#   "viewToken": "simple-1736698800000-xyz123...",
#   "expiresIn": 600
# }

# 2. Использовать токен (первый раз)
TOKEN="<полученный_токен>"
curl -X POST https://prompt-hub.site/api/track-view \
  -H 'Content-Type: application/json' \
  -H 'x-fingerprint: smoke-test-fp' \
  -H 'referer: https://prompt-hub.site/prompt/<EXISTING_PROMPT_ID>' \
  --data "{\"cardId\":\"<EXISTING_PROMPT_ID>\",\"viewToken\":\"$TOKEN\"}" \
  | jq .

# Ожидаемый ответ:
# {
#   "counted": true,
#   "views": <число>
# }

# 3. Повторно тем же токеном (должно отклониться)
curl -X POST https://prompt-hub.site/api/track-view \
  -H 'Content-Type: application/json' \
  -H 'x-fingerprint: smoke-test-fp' \
  -H 'referer: https://prompt-hub.site/prompt/<EXISTING_PROMPT_ID>' \
  --data "{\"cardId\":\"<EXISTING_PROMPT_ID>\",\"viewToken\":\"$TOKEN\"}" \
  | jq .

# Ожидаемый ответ:
# {
#   "error": "INVALID_OR_REUSED_TOKEN",
#   "reason": "TOKEN_REUSED",
#   "counted": false
# }
```

#### C. Проверка в браузере
1. Открыть DevTools → Console
2. Перейти на любую страницу промпта
3. Проверить логи:
   ```
   [VIEW_TRACKING] Starting track view
   [VIEW_TRACKING] Token response
   [VIEW_TRACKING] Sending track-view request
   [VIEW_TRACKING] Track-view response
   [VIEW_TRACKING] Completed and marked as tracked
   ```
4. Вернуться на главную → НЕ должно быть новых `[VIEW_TRACKING]` логов
5. Повторно открыть тот же промпт → Должен быть лог `Skipped - already tracked in session`

### 5. Мониторинг метрик

#### Проверка в БД (SQL)
```sql
-- Проверить отклоненные просмотры за последний час
SELECT 
  reason, 
  COUNT(*) AS count
FROM "PromptViewEvent" 
WHERE 
  "isCounted" = false
  AND "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY reason
ORDER BY count DESC;

-- Ожидаемые причины:
-- TOKEN_REUSED, DEDUP_WINDOW, INVALID_REFERER, AF_BLOCKED
```

#### Проверка Redis ключей
```bash
# SSH на сервер
ssh root@83.166.244.71

# Проверить используемые токены
redis-cli --scan --pattern "token:used:*" | head -5

# Проверить ключи дедупликации
redis-cli --scan --pattern "view:dedupe:*" | head -5

# Проверить TTL ключа
redis-cli TTL "token:used:<некоторый_токен>"
# Должен вернуть число секунд до истечения (до 3600)
```

## Откат (если что-то пошло не так)

### Быстрый откат через Git

```bash
# На сервере
cd /root/prompthub

# Посмотреть последние коммиты
git log --oneline -5

# Откатиться на предыдущий коммит
git reset --hard <previous_commit_hash>

# Перезапустить приложение
pm2 restart prompthub

# Проверить логи
pm2 logs prompthub
```

### Отключение новых проверок (если нужно временно)

Если нужно отключить какую-то проверку:

```typescript
// app/api/track-view/route.ts

// Отключить проверку токена на одноразовость
// Закомментировать строки 57-68

// Отключить дедупликацию
// Закомментировать строки 105-118

// Отключить проверку Referer
// Закомментировать строки 70-88
```

## Troubleshooting

### Проблема: Redis недоступен

**Симптом:** Ошибки вида `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Решение:**
```bash
# Проверить статус Redis
systemctl status redis

# Запустить если остановлен
systemctl start redis

# Или использовать fallback без Redis (временно)
# В track-view.route.ts добавить try-catch вокруг Redis операций
```

### Проблема: Слишком много отклонений

**Симптом:** Много `{counted: false, reason: 'DEDUP_WINDOW'}`

**Причина:** Пользователи часто обновляют страницу < 30s

**Решение:** Уменьшить окно дедупликации:
```typescript
// app/api/track-view/route.ts, строка 102
const dedupWindowSeconds = 15 // было 30
```

### Проблема: Логи не появляются

**Причина:** Production build может оптимизировать console.log

**Решение:** Использовать structured logging:
```typescript
import { logger } from '@/lib/logger'
logger.info('[TRACK-VIEW]', { data })
```

## Конфигурация переменных окружения

### Локальная разработка (.env.local)
```bash
# Redis (обязательно)
REDIS_URL=redis://localhost:6379

# View tracking (обязательно для хеширования)
VIEW_SALT=your-development-salt-change-in-production

# Опциональные фича-флаги
VIEW_DEDUP_WINDOW=30          # Секунды окна дедупликации
VIEW_TOKEN_TTL=3600           # Секунды TTL токена после использования
```

### Production (.env на сервере)
```bash
# Проверить текущие значения
ssh root@83.166.244.71 "cat /root/prompthub/.env | grep VIEW"

# Убедиться, что установлены:
VIEW_SALT=<сильный_случайный_секрет>
REDIS_URL=redis://localhost:6379
```

## Контрольный список деплоя

- [ ] Все unit-тесты проходят
- [ ] Redis запущен и доступен
- [ ] VIEW_SALT настроен в .env
- [ ] Код задеплоен через `bash scripts/deploy.sh`
- [ ] PM2 перезапущен успешно
- [ ] Логи не содержат ошибок
- [ ] Smoke test прошел успешно
- [ ] Браузерная проверка показывает правильное поведение
- [ ] Метрики в БД выглядят нормально
- [ ] Redis ключи создаются корректно

## Контакты для эскалации

При критических проблемах:
1. Проверить логи: `pm2 logs prompthub --lines 200`
2. Проверить Redis: `redis-cli ping`
3. Откатить если необходимо: `git reset --hard <previous_commit>`
4. Сообщить в команду с логами и описанием проблемы

## Дополнительная информация

- Полный отчёт: `VIEW_TRACKING_FIX_REPORT.md`
- Unit-тесты: `__tests__/track-view.test.ts`
- E2E тесты: `__tests__/e2e/view-tracking.spec.ts`
- Документация системы просмотров: см. предыдущий отчёт в чате

**Деплой готов. Удачи! 🚀**

