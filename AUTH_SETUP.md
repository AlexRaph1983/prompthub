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

## 2. Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 3. Миграция базы данных

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 4. Запуск проекта

```bash
npm run dev
```

## Функциональность

### Аутентификация
- ✅ Google OAuth 2.0
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