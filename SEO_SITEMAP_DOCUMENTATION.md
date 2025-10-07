# SEO Sitemap & Robots.txt Documentation

## Обзор

Реализована полная SEO-архитектура для prompt-hub.site с поддержкой многоязычности (ru/en), корректными sitemap и robots.txt для Яндекса и Google.

## Структура Sitemap

### Главный индекс: `/sitemap.xml`
Содержит ссылки на все дочерние карты:
- `/sitemaps/root.xml` — главная страница и статические разделы
- `/sitemaps/ru.xml`, `/sitemaps/en.xml` — локализованные разделы
- `/sitemaps/categories.xml` — все категории с локалями
- `/sitemaps/tags.xml` — все теги с локалями (≥1 промпт)
- `/sitemaps/prompts-0001.xml`, `/sitemaps/prompts-0002.xml`, ... — пагинация промптов

### URL-структура
- **Главная**: `/` (x-default), `/ru`, `/en`
- **Промпты**: `/{locale}/prompt/{slug}`
- **Категории**: `/{locale}/category/{category}`
- **Теги**: `/{locale}/tag/{tag}`

## Технические детали

### Приоритеты и частоты обновления
- **Root**: priority=1.0, changefreq=daily
- **Categories**: priority=0.7, changefreq=weekly  
- **Tags**: priority=0.6, changefreq=weekly
- **Prompts**: priority=0.8, changefreq=monthly

### Hreflang поддержка
- Все URL имеют hreflang между ru/en
- x-default указывает на EN версию
- Корректные XML namespaces для xhtml:link

### Кэширование
- Sitemap карты: 1 час (3600 сек)
- Robots.txt: 24 часа (86400 сек)
- Внутренний кэш с TTL

## Robots.txt

### Разрешенные разделы
```
User-agent: *
Allow: /
Allow: /_next/static/
Allow: /public/
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /sitemaps/
```

### Запрещенные разделы
```
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /signin
Disallow: /signup
Disallow: /settings
Disallow: /auth/
Disallow: /_next/
Disallow: /_vercel/
Disallow: /*?q=*
Disallow: /*?*utm_*
Disallow: /*?*search=*
Disallow: /*?*filter=*
Disallow: /*?*sort=*
```

### Яндекс-специфика
```
Host: prompt-hub.site
Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content /
```

## Файловая структура

```
app/
├── sitemap.xml/route.ts          # Главный индекс
├── robots.txt/route.ts           # Robots.txt
└── sitemaps/
    ├── root.xml/route.ts         # Главная страница
    ├── [locale].xml/route.ts     # Локализованные разделы
    ├── categories.xml/route.ts   # Категории
    ├── tags.xml/route.ts         # Теги
    └── prompts-[page].xml/route.ts # Пагинация промптов

lib/
└── sitemap.ts                    # Утилиты и конфигурация

__tests__/
├── lib/sitemap.test.ts           # Unit тесты
└── e2e/sitemap.e2e.test.ts       # E2E тесты
```

## Конфигурация

### Основные настройки в `lib/sitemap.ts`
```typescript
export const SITEMAP_CONFIG = {
  BASE_URL: 'https://prompt-hub.site',
  LOCALES: ['ru', 'en'] as const,
  PROMPTS_PER_PAGE: 10000, // Лимит URL на карту
  REVALIDATE_TIME: 3600, // 1 час
} as const;
```

### Изменение лимитов
Для изменения количества URL на карту промптов:
1. Измените `PROMPTS_PER_PAGE` в `lib/sitemap.ts`
2. Перезапустите приложение
3. Проверьте новые карты в `/sitemap.xml`

## Производительность

### Индексы Prisma
Добавлены индексы для оптимизации запросов:
```prisma
@@index([category])
@@index([updatedAt])
@@index([category, updatedAt])
```

### Пагинация
- Промпты разбиваются на карты по 10k URL
- Автоматическое определение количества страниц
- Кэширование результатов запросов

## Тестирование

### Unit тесты
```bash
npm run test __tests__/lib/sitemap.test.ts
```

### E2E тесты
```bash
npm run test:e2e __tests__/e2e/sitemap.e2e.test.ts
```

### Ручная проверка
1. Откройте https://prompt-hub.site/robots.txt
2. Откройте https://prompt-hub.site/sitemap.xml
3. Проверьте все дочерние карты
4. Валидируйте XML структуру

## Добавление новых сущностей

### Для добавления новых типов контента в sitemap:

1. **Добавьте билдер URL** в `lib/sitemap.ts`:
```typescript
export const urlBuilders = {
  // ... существующие
  newEntity: (slug: string, locale: Locale) => {
    return buildCanonicalUrl(`/new-entity/${slug}`, locale);
  },
} as const;
```

2. **Создайте новый роут** `app/sitemaps/new-entity.xml/route.ts`:
```typescript
// Следуйте паттерну существующих роутов
```

3. **Обновите главный индекс** в `app/sitemap.xml/route.ts`:
```typescript
sitemaps.push({
  loc: `${baseUrl}/sitemaps/new-entity.xml`,
  lastmod: formatLastMod(now),
});
```

4. **Добавьте тесты** в `__tests__/e2e/sitemap.e2e.test.ts`

## Мониторинг

### Логи
Все ошибки логируются в консоль с префиксом "Error generating sitemap"

### Метрики
- Время генерации карт
- Количество URL в каждой карте
- Статус кэша

### Алерты
Настройте мониторинг на:
- HTTP 500 ошибки sitemap роутов
- Превышение лимита размера карт (>50MB)
- Отсутствие обновлений карт >24 часов

## Troubleshooting

### Проблема: Sitemap не обновляется
**Решение**: Очистите кэш:
```typescript
import { clearCache } from '@/lib/sitemap';
clearCache(); // Очистить весь кэш
clearCache('prompts'); // Очистить только промпты
```

### Проблема: Медленная генерация
**Решение**: 
1. Проверьте индексы Prisma
2. Уменьшите `PROMPTS_PER_PAGE`
3. Добавьте кэширование на уровне БД

### Проблема: Невалидный XML
**Решение**:
1. Проверьте экранирование специальных символов
2. Валидируйте URL через `isValidUrl()`
3. Проверьте формат дат в `formatLastMod()`

## Безопасность

### Защита от DDoS
- Rate limiting на уровне Next.js
- Кэширование результатов
- Валидация параметров

### Приватные данные
- Исключены все `/api/*`, `/admin/*`, `/dashboard/*`
- Фильтрация по авторизации
- Нет утечек пользовательских данных

## SEO Best Practices

### Для Яндекса
- Host директива в robots.txt
- Clean-param для UTM параметров
- Корректные hreflang

### Для Google
- Валидный XML sitemap
- Правильные lastmod даты
- Приоритеты и частоты обновления

### Общие
- Кэширование для производительности
- Пагинация больших карт
- Валидация всех URL
