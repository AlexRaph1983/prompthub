# Инструкции для деплоя на сервер Orange Curium

## Сервер
- IP: REDACTED_IP
- Логин: root
- Пароль: REDACTED_PASSWORD

## Изменения для восстановления авторизации Google

### 1. Исправления в коде:
- ✅ Исправлен путь к странице входа в NextAuth: `/ru/auth/signin`
- ✅ Добавлен NEXTAUTH_SECRET в конфигурацию
- ✅ Восстановлен файл `app/[locale]/layout.tsx` с AuthProvider
- ✅ Изменена схема Prisma на SQLite для локальной разработки

### 2. Команды для деплоя на сервер:

```bash
# Подключение к серверу
ssh root@REDACTED_IP

# Переход в директорию проекта
cd /root/prompthub

# Получение последних изменений
git fetch origin
git reset --hard origin/main

# Установка зависимостей
npm install

# Генерация Prisma клиента
npx prisma generate

# Запуск миграций (если нужно)
npx prisma migrate deploy

# Перезапуск приложения
pm2 restart prompthub
```

### 3. Настройка переменных окружения на сервере:

Создать файл `.env.local` на сервере:
```env
# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=D7Seqs48GNrIx519i7S8WqyQBoAwLiImJkegciWv/nU=

# Google OAuth - НУЖНО ОБНОВИТЬ ПОСЛЕ СОЗДАНИЯ НОВОГО КЛИЕНТА
GOOGLE_CLIENT_ID=your-new-client-id
GOOGLE_CLIENT_SECRET=your-new-client-secret

# Auth debug/testing
AUTH_FORCE_TEST=0
```

### 4. Создание нового Google OAuth клиента:

1. Перейти в [Google Cloud Console](https://console.cloud.google.com/)
2. Создать новый OAuth 2.0 клиент
3. Добавить redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Обновить GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env.local

### 5. Проверка работы:

После деплоя проверить:
- Авторизация через Google работает
- Страницы загружаются корректно
- База данных подключена

## Файлы, которые были изменены:
- `app/api/auth/[...nextauth]/route.ts` - исправлена конфигурация NextAuth
- `app/[locale]/layout.tsx` - восстановлен layout с AuthProvider
- `prisma/schema.prisma` - изменен на SQLite для локальной разработки




