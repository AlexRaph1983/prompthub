# 🛠️ WORKING STATE - PromptHub

## 📊 **Статус проекта**
- **Последнее рабочее состояние**: Требуется определение
- **Текущее состояние**: 502 Bad Gateway
- **Стек**: Next.js 14 + TypeScript + Prisma + NextAuth
- **Менеджер пакетов**: PNPM 10.17.0

## 🔧 **Технические характеристики**

### **Runtime Requirements**
```bash
Node.js: 18+
PNPM: 10.17.0
PM2: Latest
Nginx: Latest
```

### **Ключевые зависимости**
```json
{
  "next": "14.0.0",
  "react": "^18.2.0", 
  "prisma": "^6.13.0",
  "next-auth": "^4.24.5",
  "next-intl": "^3.0.0",
  "jose": "^5.9.3"
}
```

## 📋 **Команды для воспроизведения**

### **Локальная разработка**
```bash
# 1. Установка зависимостей
corepack enable
pnpm install --frozen-lockfile

# 2. Настройка базы данных
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 3. Создание .env.local
cp .env.example .env.local
# Заполнить переменные окружения

# 4. Запуск разработки
pnpm dev
```

### **Production сборка**
```bash
# 1. Сборка
pnpm build

# 2. Запуск
pnpm start
```

### **Тестирование**
```bash
# Линтинг и типы
pnpm lint
pnpm type-check

# Тесты
pnpm test
pnpm test:e2e
```

## 🔐 **Переменные окружения**

### **Обязательные**
```bash
# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=file:./dev.db  # SQLite для dev
# DATABASE_URL=postgresql://... # PostgreSQL для prod

# OAuth (опционально)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Дополнительные**
```bash
# Production
NODE_ENV=production
AUTH_FORCE_TEST=0

# Admin API (новые)
ADMIN_API_KEY=your-admin-api-key
IMPERSONATION_SECRET=your-impersonation-secret
```

## 🏥 **Health проверки**

### **Endpoints для проверки**
```bash
# Основной сайт
GET https://prompt-hub.site/

# Health endpoint (если есть)
GET https://prompt-hub.site/api/health

# Admin API (новое)
GET https://prompt-hub.site/api/admin/users
Authorization: Bearer <ADMIN_API_KEY>
```

## 🚀 **Деплой на продакшен**

### **Стандартный деплой**
```bash
cd /root/prompthub
git fetch origin
git reset --hard origin/main
bash scripts/deploy.sh
```

### **PM2 конфигурация**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'prompthub',
    script: 'npm',
    args: 'start',
    cwd: '/root/prompthub',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXTAUTH_SECRET: 'production-secret'
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

## ⚠️ **Известные проблемы**

### **Текущие проблемы**
1. **502 Bad Gateway** - PM2 процесс не отвечает
2. **Admin API нестабильность** - недавние изменения в коммите 008c811
3. **Отсутствие CI/CD** - нет GitHub Actions
4. **TypeScript ошибки** - в admin routes

### **Потенциальные причины**
- Поврежденная сборка Next.js
- Неправильные переменные окружения
- Проблемы с Prisma миграциями
- PM2 конфигурация

## 🔄 **План восстановления**

### **Немедленные действия**
1. Определить последний стабильный коммит
2. Откат к стабильной версии
3. Проверка работоспособности
4. Анализ причин поломки

### **Долгосрочные улучшения**
1. Настройка CI/CD (GitHub Actions)
2. Автоматизированные тесты
3. Health monitoring
4. Rollback стратегия

## 📚 **Документация**

### **Файлы конфигурации**
- `package.json` - зависимости и скрипты
- `prisma/schema.prisma` - схема БД
- `next.config.js` - конфигурация Next.js
- `tailwind.config.js` - стили
- `scripts/deploy.sh` - скрипт деплоя

### **Ключевые директории**
- `app/` - App Router страницы
- `components/` - React компоненты
- `lib/` - утилиты и конфигурация
- `prisma/` - схема и миграции БД
- `scripts/` - скрипты автоматизации

---

**Обновлено**: ${new Date().toISOString()}
**Статус**: В процессе восстановления
