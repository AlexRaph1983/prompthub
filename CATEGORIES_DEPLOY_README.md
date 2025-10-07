# Развёртывание системы категорий

## Быстрый старт

### 1. Миграция базы данных
```bash
npx prisma migrate dev --name add-categories-hierarchy
```

### 2. Заполнение данными
```bash
node scripts/seed-categories.js
```

### 3. Обновление счётчиков
```bash
node scripts/update-category-counts.js update
```

### 4. Проверка работы
```bash
npm run dev
```

## Что было добавлено

### 🗄️ База данных
- **Category** - категории с иерархией и i18n
- **Tag** - теги с поддержкой NSFW
- **PromptTag** - связь многие-ко-многим
- Индексы для производительности

### 🎨 Компоненты
- **CategoryNav** - левое меню для десктопа
- **CategoryDrawer** - мобильное меню
- **NsfwWarning** - предупреждение для взрослого контента

### 📄 Страницы
- `/[locale]/category/[slug]` - страницы категорий
- SEO-оптимизированные метаданные
- Структурированные данные

### 🛠️ Утилиты
- `lib/categories.ts` - работа с категориями
- `lib/seo.ts` - SEO метаданные
- `lib/url.ts` - генерация URL
- `lib/filters.ts` - фильтрация

## Структура файлов

```
app/[locale]/(public)/
├── layout.tsx                 # Трёхколоночный layout
├── CategoryNav.tsx            # Левое меню (client)
├── CategoryNavServer.tsx      # Серверный wrapper
├── CategoryDrawer.tsx         # Мобильное меню (client)
├── CategoryDrawerServer.tsx   # Серверный wrapper
├── NsfwWarning.tsx           # NSFW предупреждение
└── category/[slug]/
    └── page.tsx              # Страница категории

lib/
├── categories.ts              # API для категорий
├── seo.ts                    # SEO утилиты
├── url.ts                    # URL генерация
└── filters.ts                # Фильтрация

scripts/
├── seed-categories.js         # Заполнение данными
└── update-category-counts.js # Обновление счётчиков

__tests__/
├── categories.test.ts         # Unit тесты
└── e2e/categories.spec.ts    # E2E тесты
```

## Категории по умолчанию

### Основные категории
- **Промпты для юристов** (Legal)
- **Промпты для врачей** (Health)
- **Промпты для обучения** (Education)
- **Промпты для написания текстов** (Marketing & Writing)
- **Промпты для фото** (Image)
- **Промпты для видео** (Video)
- И ещё 16 категорий...

### Подкатегории для Image
- **Фотосессии** (Photography)
- **Обработка фото** (Photo Editing)
- **NSFW 18+** (NSFW)

### Теги
- ChatGPT, Claude, Gemini
- Midjourney, DALL-E, Stable Diffusion
- NSFW, Бесплатно, Премиум
- Популярное, Новое

## SEO оптимизация

### Метаданные
- Уникальные title и description
- Hreflang для ru/en
- Open Graph и Twitter Cards
- Структурированные данные

### URL структура
- `/ru/category/legal` - русская версия
- `/en/category/legal` - английская версия
- `/ru/category/image?nsfw=true` - с NSFW фильтром

## Адаптивность

### Десктоп (≥1024px)
- Трёхколоночный layout
- Sticky левое меню
- Правая колонка с дополнительной информацией

### Мобильный (<1024px)
- Одноколоночный layout
- Drawer меню слева
- Touch-friendly интерфейс

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

## Мониторинг

### Счётчики промптов
```bash
# Обновить все счётчики
node scripts/update-category-counts.js update

# Показать статистику
node scripts/update-category-counts.js stats

# Полный отчёт
node scripts/update-category-counts.js full
```

### Логи
- Ошибки загрузки категорий
- NSFW доступ без подтверждения
- SEO метрики

## Безопасность

### NSFW контент
- Обязательное подтверждение возраста
- Запоминание выбора в localStorage
- Блокировка доступа без подтверждения

### Валидация
- Проверка слагов на уникальность
- Санитизация пользовательского ввода
- Валидация NSFW флагов

## Производительность

### Кэширование
- Счётчики промптов в БД
- Revalidation: 300-900 секунд
- Предзагрузка ссылок

### Индексы
- `idx_category_parent_id`
- `idx_category_slug`
- `idx_category_active_sort`
- `idx_tag_slug`
- `idx_tag_nsfw`

## Troubleshooting

### Проблемы с категориями
1. Проверить индексы: `npx prisma studio`
2. Обновить счётчики: `node scripts/update-category-counts.js update`
3. Проверить кэш браузера

### Проблемы с NSFW
1. Очистить localStorage
2. Проверить настройки браузера
3. Проверить логи доступа

### SEO проблемы
1. Проверить метаданные в DevTools
2. Проверить структурированные данные
3. Проверить hreflang атрибуты

## Дальнейшее развитие

### Возможные улучшения
- Кэширование в Redis
- Аналитика по категориям
- Персонализация рекомендаций
- A/B тестирование интерфейса

### Добавление новых категорий
1. Обновить `scripts/seed-categories.js`
2. Запустить сид скрипт
3. Обновить переводы в `messages/`
4. Добавить тесты

### Добавление новых тегов
1. Создать тег через Prisma Studio
2. Обновить счётчики
3. Добавить в популярные теги

## Поддержка

При возникновении проблем:
1. Проверить логи в консоли
2. Проверить состояние БД
3. Обновить счётчики
4. Очистить кэш браузера
