# Настройка аутентификации PromptHub

## 1. Настройка Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials:
   - Перейдите в "APIs & Services" > "Credentials"
   - Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
   - Выберите "Web application"
   - Добавьте авторизованные URI перенаправления:
     - `http://localhost:3000/api/auth/callback/google` (для разработки)
     - `https://yourdomain.com/api/auth/callback/google` (для продакшена)

## 2. Настройка VK OAuth

1. Перейдите в [VK Developers](https://vk.com/dev)
2. Создайте новое приложение или выберите существующее
3. В настройках приложения:
   - Добавьте авторизованные URI перенаправления:
     - `http://localhost:3000/api/auth/callback/vk` (для разработки)
     - `https://yourdomain.com/api/auth/callback/vk` (для продакшена)
   - Скопируйте `Application ID` (это ваш `VK_CLIENT_ID`)
   - Скопируйте `Secure key` (это ваш `VK_CLIENT_SECRET`)

## 3. Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# VK OAuth
VK_CLIENT_ID=your-vk-client-id
VK_CLIENT_SECRET=your-vk-client-secret
```

## 4. Миграция базы данных

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 5. Запуск проекта

```bash
npm run dev
```

## Функциональность

### Аутентификация
- ✅ Google OAuth 2.0
- ✅ VK OAuth 2.0
- ✅ JWT strategy
- ✅ Prisma adapter
- ✅ Edge Runtime поддержка

### Навигация
- ✅ Кнопка "Sign In" для неавторизованных пользователей
- ✅ Аватар с выпадающим меню для авторизованных пользователей
- ✅ Кнопка "Add Prompt" в навигации
- ✅ Меню: Profile / My Prompts / Sign Out

### Личный кабинет
- ✅ `/dashboard/profile` - профиль пользователя
- ✅ `/dashboard/prompts` - промпты пользователя
- ✅ Защита маршрутов через `auth()`

### API
- ✅ `/api/prompts` - создание и получение промптов
- ✅ Автоматическое связывание промптов с автором

### Отзывы и рейтинги
- ✅ `/api/ratings` — существующий эндпоинт для звёзд (средняя/кол-во и моя оценка)
- ✅ `/api/reviews` — новый эндпоинт отзывов:
  - `GET /api/reviews?promptId=...` — список отзывов (новые сверху)
  - `POST /api/reviews` — добавить/обновить отзыв: `{ promptId, rating: 1..5, comment?: string }`
  - Кэш полей `Prompt.averageRating`, `Prompt.totalRatings` пересчитывается после каждого POST

## Структура базы данных

```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String?  @unique
  image     String?   
  createdAt DateTime @default(now())
  prompts   Prompt[]
}

model Prompt {
  id          String   @id @default(cuid())
  title       String
  description String
  prompt      String
  model       String
  lang        String
  category    String
  tags        String
  license     String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
}
```

## Компоненты

### Новые компоненты
- `Navigation.tsx` - навигация с аутентификацией
- `AddPromptModal.tsx` - модальное окно добавления промптов
- `Avatar.tsx` - компонент аватара
- `dropdown-menu.tsx` - выпадающее меню

### Обновленные компоненты
- `PromptStore.tsx` - интеграция с API
- `layout.tsx` - добавлен SessionProvider и Navigation

### API endpoints
- `/api/auth/[...nextauth]` - NextAuth конфигурация
- `/api/prompts` - CRUD операции для промптов

### Хуки
- `useAuth.ts` - хук для работы с аутентификацией

### Типы
- `next-auth.d.ts` - типы для NextAuth
- Обновлены типы в `prompt.ts` 