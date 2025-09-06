# PromptHub

Промпты для нейросетей — на все случаи жизни. Публикуй свои лучшие промпты, находи подборки под любые задачи и AI-платформы. Мультиязычно. Открыто. Бесплатно.

## 🚀 Технологии

- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - строгая типизация
- **Tailwind CSS** - утилитарный CSS фреймворк
- **shadcn/ui** - компонентная библиотека
- **framer-motion** - анимации
- **lucide-react** - иконки
- **next-intl** - интернационализация
- **NextAuth.js** - аутентификация (Google, VK)

## 📦 Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/prompthub.git
cd prompthub
```

2. Установите зависимости:
```bash
npm install
# или
yarn install
# или
pnpm install
```

3. Запустите проект:
```bash
npm run dev
# или
yarn dev
# или
pnpm dev
```

4. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 🏗️ Архитектура

### Структура проекта
```
prompthub/
├── app/                    # App Router
│   ├── (public)/          # Публичные страницы
│   │   └── home/          # Главная страница
│   ├── globals.css        # Глобальные стили
│   └── layout.tsx         # Корневой layout
├── components/            # React компоненты
│   ├── ui/               # UI компоненты (shadcn/ui)
│   └── AddPromptModal.tsx # Модальное окно добавления
├── contexts/             # React Context
│   └── PromptStore.tsx   # Управление состоянием
├── data/                 # Данные
│   └── demoPrompts.ts    # Демо-промпты
├── hooks/                # Кастомные хуки
│   └── useSearch.ts      # Хук поиска с debounce
├── lib/                  # Утилиты
│   └── utils.ts          # Утилиты для классов
├── types/                # TypeScript типы
│   └── prompt.ts         # Типы промптов
└── messages/             # Переводы (i18n)
    ├── ru.json
    └── en.json
```

### State Management
- **React Context** для управления состоянием промптов
- **useReducer** для сложной логики состояния
- **useOptimistic** для оптимистичных обновлений

### Компоненты
- **Server Components** по умолчанию
- **Client Components** для интерактивности
- **shadcn/ui** для консистентного дизайна

## 🎨 Дизайн-система

### Цвета
- **Violet** - основной брендинг
- **Blue** - акценты
- **Gray** - нейтральные цвета

### Стили
- **Скругления**: `rounded-2xl`
- **Тени**: `shadow-md`
- **Анимации**: framer-motion

## 🔧 Разработка

### Команды
```bash
npm run dev      # Запуск в режиме разработки
npm run build    # Сборка для продакшена
npm run start    # Запуск продакшен сборки
npm run lint     # Проверка кода
npm run type-check # Проверка типов
npm run test     # Тесты Vitest
npm run test:e2e # E2E тесты Playwright
```

### i18n & Middleware

Проект использует кастомный middleware для локализации с префиксом `/[locale]`:

- **localeDetection: false** - отключено автоматическое определение локали Next.js
- **Rewrite вместо redirect** - для избежания видимых редиректов в URL
- **Исключения из matcher**: `_next`, `api`, `assets`, статические файлы
- **Логирование**: включить `DEBUG_I18N=true` для отладки middleware

**Очистка cookies при локальной отладке:**
```bash
# Очистить порт и cookies
npx kill-port 3000 || true
# Или вручную удалить NEXT_LOCALE cookie в браузере
```

### Переменные окружения
Создайте `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Аутентификация
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# VK OAuth
VK_CLIENT_ID=your-vk-client-id
VK_CLIENT_SECRET=your-vk-client-secret
```

Подробные инструкции по настройке аутентификации см. в [AUTH_SETUP.md](AUTH_SETUP.md) и [VK_SETUP.md](VK_SETUP.md).

## ⭐ Рейтинги промптов

1) Миграция БД:

```bash
npx prisma migrate dev --name ratings
```

2) API:

- POST `/api/ratings` — тело: `{ promptId: string, value: 1..5 }`
- GET `/api/ratings?promptId=...` — ответ: `{ average, count, myRating }`

3) UI:

- Карточки: отображают среднюю оценку и количество
- Страница промпта: интерактивные звезды для авторизованных

## 🚀 Деплой

### Vercel (рекомендуется)
1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Деплой произойдет автоматически

### Другие платформы
- **Netlify**: `npm run build && npm run export`
- **Railway**: Поддерживает Next.js из коробки
- **Docker**: Создайте Dockerfile

## 📝 Лицензия

MIT License - см. [LICENSE](LICENSE) файл.

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

- **Issues**: [GitHub Issues](https://github.com/your-username/prompthub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/prompthub/discussions)
- **Email**: support@prompthub.com 