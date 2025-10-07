# Документация по системе категорий

## Обзор

Система категорий в PromptHub обеспечивает структурированную навигацию по промптам с поддержкой иерархии, i18n, SEO-оптимизации и фильтрации.

## Архитектура

### Модели данных

#### Category
```typescript
model Category {
  id            String   @id @default(cuid())
  nameRu        String   // Русское название для SEO
  nameEn        String   // Английское название
  slug          String   @unique // URL-слаг
  descriptionRu String?  // Описание на русском
  descriptionEn String?  // Описание на английском
  parentId      String?  // ID родительской категории
  parent        Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children      Category[] @relation("CategoryHierarchy")
  isActive      Boolean  @default(true)
  sortOrder     Int      @default(0)
  promptCount   Int      @default(0) // Кэш количества промптов
}
```

#### Tag
```typescript
model Tag {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  isNsfw      Boolean  @default(false)
  isActive    Boolean  @default(true)
  color       String?  // Цвет тега (hex)
  promptCount Int      @default(0)
}
```

#### PromptTag (связь многие-ко-многим)
```typescript
model PromptTag {
  id       String @id @default(cuid())
  promptId String
  tagId    String
  prompt   Prompt @relation(fields: [promptId], references: [id])
  tag      Tag    @relation(fields: [tagId], references: [id])
}
```

## Компоненты

### CategoryNav
Левое меню категорий для десктопа:
- Sticky позиционирование (top: 80px)
- Поддержка иерархии (родительские/дочерние категории)
- Счётчики промптов
- Активное состояние
- Keyboard navigation

### CategoryDrawer
Мобильное меню категорий:
- Radix Sheet/Dialog
- 80% ширины экрана
- Touch-friendly интерфейс
- Автозакрытие при клике

### NsfwWarning
Модальное предупреждение для NSFW контента:
- Подтверждение возраста
- Запоминание выбора в localStorage
- Блокировка доступа без подтверждения

## Страницы

### /[locale]/category/[slug]
Страница категории с:
- SEO-оптимизированным H1
- Уникальным описанием
- Подкатегориями (если есть)
- Популярными тегами
- Фильтрацией промптов
- Структурированными данными

## API

### Фильтры промптов
```typescript
interface PromptListParams {
  categoryId?: string  // Фильтр по ID категории
  tag?: string        // Фильтр по тегу
  nsfw?: boolean      // NSFW фильтр
  // ... другие фильтры
}
```

### URL параметры
- `category` - фильтр по категории
- `tag` - фильтр по тегу
- `nsfw=true` - показать NSFW контент
- `page` - номер страницы

## SEO

### Метаданные
- Title: `{H1} — {Бренд}`
- Description: уникальное описание категории
- Keywords: автоматически генерируемые
- Hreflang: поддержка ru/en

### Структурированные данные
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Промпты для юристов",
  "description": "Подборка промптов для юридических задач...",
  "url": "https://example.com/ru/category/legal",
  "mainEntity": {
    "@type": "ItemList",
    "name": "Промпты для юристов - Промпты",
    "numberOfItems": 10
  }
}
```

## Утилиты

### lib/categories.ts
- `getCategoriesTree()` - дерево категорий
- `getCategoryBySlug()` - категория по слагу
- `getPopularTagsForCategory()` - популярные теги
- `updateCategoryPromptCounts()` - обновление счётчиков

### lib/seo.ts
- `generateCategoryMetadata()` - метаданные страницы
- `generateCategoryStructuredData()` - структурированные данные
- `generateHomeMetadata()` - метаданные главной

### lib/url.ts
- `createCategoryUrl()` - URL категории
- `createTagUrl()` - URL тега
- `createPromptsUrl()` - URL с фильтрами

### lib/filters.ts
- `parseFiltersFromUrl()` - парсинг фильтров
- `createUrlParams()` - создание параметров
- `validateFilters()` - валидация фильтров

## Добавление новых категорий

### 1. Через сид скрипт
```javascript
// scripts/seed-categories.js
const newCategory = {
  slug: 'new-category',
  nameRu: 'Новая категория',
  nameEn: 'New Category',
  descriptionRu: 'Описание на русском',
  descriptionEn: 'Description in English',
  sortOrder: 23
};
```

### 2. Через Prisma Studio
```bash
npx prisma studio
```

### 3. Через API (для админов)
```typescript
await prisma.category.create({
  data: {
    slug: 'new-category',
    nameRu: 'Новая категория',
    nameEn: 'New Category',
    // ...
  }
});
```

## Добавление подкатегорий

```typescript
await prisma.category.create({
  data: {
    slug: 'subcategory',
    nameRu: 'Подкатегория',
    nameEn: 'Subcategory',
    parentId: 'parent-category-id',
    sortOrder: 1
  }
});
```

## Управление тегами

### Создание тега
```typescript
await prisma.tag.create({
  data: {
    name: 'ChatGPT',
    slug: 'chatgpt',
    description: 'Промпты для ChatGPT',
    isNsfw: false,
    color: '#10a37f'
  }
});
```

### NSFW теги
```typescript
await prisma.tag.create({
  data: {
    name: 'NSFW',
    slug: 'nsfw',
    description: 'Контент для взрослых',
    isNsfw: true,
    color: '#ff4444'
  }
});
```

## Обновление переводов

### messages/ru.json
```json
{
  "categories": {
    "NewCategory": "Новая категория"
  },
  "categoryNav": {
    "title": "Категории",
    "allCategories": "Все категории"
  }
}
```

### messages/en.json
```json
{
  "categories": {
    "NewCategory": "New Category"
  },
  "categoryNav": {
    "title": "Categories",
    "allCategories": "All categories"
  }
}
```

## Тестирование

### Unit тесты
```bash
npm run test categories.test.ts
```

### E2E тесты
```bash
npm run test:e2e categories.spec.ts
```

### Lighthouse
```bash
npm run lighthouse
```

## Производительность

### Кэширование
- Счётчики промптов кэшируются в БД
- Обновление через `updateCategoryPromptCounts()`
- Revalidation: 300-900 секунд

### Индексы
```sql
CREATE INDEX idx_category_parent_id ON Category(parentId);
CREATE INDEX idx_category_slug ON Category(slug);
CREATE INDEX idx_category_active_sort ON Category(isActive, sortOrder);
CREATE INDEX idx_tag_slug ON Tag(slug);
CREATE INDEX idx_tag_nsfw ON Tag(isNsfw);
```

## Мониторинг

### Метрики
- Количество промптов по категориям
- Популярность тегов
- NSFW контент (с предупреждениями)
- SEO метрики (Core Web Vitals)

### Логи
- Ошибки загрузки категорий
- Проблемы с фильтрацией
- NSFW доступ без подтверждения

## Безопасность

### NSFW контент
- Обязательное подтверждение возраста
- Запоминание выбора в localStorage
- Блокировка доступа без подтверждения
- Логирование попыток доступа

### Валидация
- Проверка слагов на уникальность
- Валидация NSFW флагов
- Санитизация пользовательского ввода

## Развёртывание

### Миграции
```bash
npx prisma migrate dev --name add-categories
```

### Сид данных
```bash
node scripts/seed-categories.js
```

### Обновление счётчиков
```bash
node scripts/update-category-counts.js
```

## Troubleshooting

### Проблемы с категориями
1. Проверить индексы в БД
2. Обновить счётчики промптов
3. Проверить кэш браузера

### Проблемы с NSFW
1. Очистить localStorage
2. Проверить настройки браузера
3. Проверить логи доступа

### SEO проблемы
1. Проверить метаданные
2. Проверить структурированные данные
3. Проверить hreflang атрибуты
