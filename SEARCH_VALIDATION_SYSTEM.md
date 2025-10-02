# 🛡️ Система защиты от псевдо-запросов

## 📋 Обзор системы

Реализована продвинутая система валидации поисковых запросов с защитой от псевдо-запросов, метриками и детальной аналитикой.

## 🎯 Правила валидации

### **1. Обязательные параметры:**
- ✅ `query` - поисковый запрос (строка)
- ✅ `finished=true` - флаг завершения (только при Enter/blur)

### **2. Правила длины:**
- ✅ Минимум: **3 символа**
- ✅ Максимум: **200 символов**

### **3. Правила содержания:**
- ✅ Минимум **40% букв** (исключая пробелы)
- ✅ Максимум **3 одинаковых символа подряд**
- ❌ Запрещены запросы только из цифр
- ❌ Запрещены запросы только из спецсимволов

### **4. Нормализация:**
- ✅ **NFKC Unicode** нормализация
- ✅ Trim и приведение к нижнему регистру
- ✅ Удаление множественных пробелов

## 📁 Архитектура системы

### **Новые файлы:**

#### **Валидация:**
- `lib/search-validation.ts` - Основная логика валидации
- `lib/search-metrics.ts` - Система метрик
- `app/api/admin/search-metrics/route.ts` - API для метрик
- `components/admin/AdminSearchMetrics.tsx` - UI для метрик

#### **Тесты:**
- `__tests__/lib/search-validation.test.ts` - Unit тесты валидации
- `__tests__/lib/search-metrics.test.ts` - Unit тесты метрик
- `__tests__/e2e/search-validation.e2e.test.ts` - E2E тесты

#### **Миграции:**
- `prisma/migrations/20241202_add_search_metrics/migration.sql` - SQL миграция

### **Обновленные файлы:**
- `app/api/search-tracking/route.ts` - Интеграция с новой валидацией
- `hooks/useSearchTracking.ts` - Отправка флага finished
- `prisma/schema.prisma` - Модель SearchMetrics

## 🔧 Технические детали

### **Валидация запросов:**
```typescript
const validation = validateSearchQuery(query, finished)
if (!validation.valid) {
  await incrementRejectedCount(validation.reason!)
  return { error: validation.reason }
}
```

### **Метрики в реальном времени:**
```typescript
// При сохранении
await incrementSavedCount()

// При отклонении
await incrementRejectedCount('TOO_SHORT')
```

### **Дедупликация:**
```typescript
const queryHash = createQueryHash(normalizedQuery, userId, ipHash)
// Проверка дубликатов за последние 5 минут
```

## 📊 Система метрик

### **Основные метрики:**
- `countSaved` - Количество сохраненных запросов
- `countRejected` - Количество отклоненных запросов
- `acceptanceRate` - Процент принятых запросов
- `rejectionRate` - Процент отклоненных запросов

### **Детальная статистика:**
- Причины отклонения с количеством
- Процентное соотношение причин
- Человекочитаемые описания

### **API endpoints:**
```bash
GET /api/admin/search-metrics
GET /api/admin/search-metrics?includeStats=true
```

## 🧪 Тестирование

### **Unit тесты:**
```bash
npm test -- --testPathPattern="search-validation|search-metrics"
```

### **E2E тесты:**
```bash
npx playwright test __tests__/e2e/search-validation.e2e.test.ts
```

## 📈 Ожидаемые результаты

### **До внедрения:**
- ❌ Мусорные запросы: "а", "аб", "123456", "!!!!!"
- ❌ Незавершенные запросы при каждом символе
- ❌ Нет аналитики качества запросов

### **После внедрения:**
- ✅ Только качественные запросы: "проверка", "тест поиска"
- ✅ Логирование только завершенных запросов
- ✅ Детальная аналитика с причинами отклонения
- ✅ Снижение нагрузки на БД на 90%+

## 🔍 Админ-панель

### **Новая страница метрик:**
- 📊 Общая статистика (сохранено/отклонено)
- 📈 Процент принятых запросов
- 🔍 Детальная статистика отклонений
- 📋 Причины отклонения с описаниями

### **Навигация:**
```
/admin/search-metrics - Метрики валидации
/admin/search-analytics - Аналитика поиска
```

## 🚀 Миграция БД

### **Новая таблица SearchMetrics:**
```sql
CREATE TABLE "SearchMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count_saved" INTEGER NOT NULL DEFAULT 0,
    "count_rejected" INTEGER NOT NULL DEFAULT 0,
    "rejection_reasons" TEXT NOT NULL DEFAULT '{}',
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### **Команды миграции:**
```bash
npx prisma migrate dev --name add_search_metrics
npx prisma db push
```

## 📋 Логирование

### **Серверные логи:**
- `✅ Search query tracked: [query]` - успешное сохранение
- `❌ Search query rejected: [reason]` - отклонение с причиной
- `⚠️ Duplicate search query detected: [query]` - дубликат

### **Метрики отклонений:**
- `TOO_SHORT` - Слишком короткий запрос
- `INSUFFICIENT_LETTERS` - Недостаточно букв
- `TOO_MANY_CONSECUTIVE_CHARS` - Много одинаковых символов
- `ONLY_NUMBERS` - Только цифры
- `ONLY_SPECIAL_CHARS` - Только спецсимволы
- `QUERY_NOT_FINISHED` - Запрос не завершен

## 🎯 Преимущества системы

1. **Качество данных** - только осмысленные запросы
2. **Производительность** - снижение нагрузки на БД
3. **Аналитика** - детальная статистика отклонений
4. **Мониторинг** - отслеживание качества в реальном времени
5. **Масштабируемость** - эффективная дедупликация
