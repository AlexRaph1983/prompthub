# 🔄 НАСТРОЙКА GOOGLE OAUTH ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ И ПРОДАКШЕНА

## 🎯 **РЕШЕНИЕ: ОДИН GOOGLE ПРОЕКТ ДЛЯ ОБЕИХ СРЕД**

### **Шаг 1: Настройте Google Cloud Console**

#### 1.1 Создайте/выберите проект
- Перейдите: https://console.cloud.google.com/
- Создайте проект: "PromptHub" (или выберите существующий)

#### 1.2 Включите Google+ API
- **APIs & Services** → **Library**
- Найдите **"Google+ API"** → **Enable**

#### 1.3 Настройте OAuth consent screen
- **APIs & Services** → **OAuth consent screen**
- **User Type**: External
- **App name**: PromptHub
- **User support email**: ваш email
- **Developer contact**: ваш email
- **Save & Continue** → **Save & Continue** → **Save & Continue**

#### 1.4 Создайте OAuth 2.0 credentials
- **APIs & Services** → **Credentials**
- **+ CREATE CREDENTIALS** → **OAuth client ID**
- **Application type**: Web application
- **Name**: PromptHub Multi-Environment

#### 1.5 ⭐ КЛЮЧЕВОЙ МОМЕНТ: Добавьте ВСЕ redirect URIs
```
http://localhost:3000/api/auth/callback/google
http://localhost:3000
http://YOUR_SERVER_IP_HERE:3000/api/auth/callback/google
http://YOUR_SERVER_IP_HERE:3000
```

**Сохраните** и скопируйте:
- **Client ID**: `ваш-client-id`
- **Client Secret**: `ваш-client-secret`

---

## **Шаг 2: Настройте локальную среду**

### 2.1 Создайте `.env.local` в корне проекта:

```bash
# ЛОКАЛЬНАЯ РАЗРАБОТКА (.env.local)
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=D7Seqs48GNrIx519i7S8WqyQBoAwLiImJkegciWv/nU=

# Google OAuth (ОДИНАКОВЫЕ для локальной и продакшен среды)
GOOGLE_CLIENT_ID=ваш-client-id-из-google-console
GOOGLE_CLIENT_SECRET=ваш-client-secret-из-google-console

# Admin Configuration
ADMIN_EMAIL=ваш-email@gmail.com
ADMIN_API_KEY=admin-secret-key-2024

# Database (локальная SQLite)
DATABASE_URL="file:./dev.db"

# Auth debug/testing
AUTH_FORCE_TEST=0
```

### 2.2 Запустите локальную разработку:
```bash
npm install
npx prisma db push
npm run dev
```

**Тестируйте**: http://localhost:3000

---

## **Шаг 3: Настройте продакшен среду**

### 3.1 Обновите `.env.local` на сервере:

```bash
# Подключитесь к серверу
ssh root@YOUR_SERVER_IP_HERE

# Перейдите в папку проекта
cd /root/prompthub

# Отредактируйте .env.local
nano .env.local
```

### 3.2 Обновите содержимое `.env.local` на сервере:

```bash
# ПРОДАКШЕН СРЕДА (.env.local на сервере)
# NextAuth Configuration
NEXTAUTH_URL=http://YOUR_SERVER_IP_HERE:3000
NEXTAUTH_SECRET=D7Seqs48GNrIx519i7S8WqyQBoAwLiImJkegciWv/nU=

# Google OAuth (ТЕ ЖЕ САМЫЕ credentials)
GOOGLE_CLIENT_ID=ваш-client-id-из-google-console
GOOGLE_CLIENT_SECRET=ваш-client-secret-из-google-console

# Admin Configuration
ADMIN_EMAIL=ваш-email@gmail.com
ADMIN_API_KEY=admin-secret-key-2024

# Database (продакшен SQLite)
DATABASE_URL="file:./prod.db"

# Auth debug/testing
AUTH_FORCE_TEST=0
```

### 3.3 Перезапустите сервер:
```bash
pm2 restart all
```

**Тестируйте**: http://YOUR_SERVER_IP_HERE:3000

---

## **🎯 РЕЗУЛЬТАТ:**

### ✅ **Локальная разработка:**
- **URL**: http://localhost:3000
- **Админ-панель**: http://localhost:3000/admin
- **База данных**: SQLite (dev.db)

### ✅ **Продакшен:**
- **URL**: http://YOUR_SERVER_IP_HERE:3000
- **Админ-панель**: http://YOUR_SERVER_IP_HERE:3000/admin
- **База данных**: SQLite (prod.db)

### ✅ **Одинаковая авторизация:**
- **Один Google аккаунт** для обеих сред
- **Одинаковые credentials** в Google Console
- **Одинаковая функциональность** везде

---

## **🔧 ВАЖНЫЕ МОМЕНТЫ:**

### **1. Google Console:**
- **Один проект** для обеих сред
- **Все redirect URIs** добавлены
- **Одинаковые credentials** везде

### **2. Различия в настройках:**
- **NEXTAUTH_URL**: разный для каждой среды
- **DATABASE_URL**: разные файлы БД
- **GOOGLE_CLIENT_ID/SECRET**: одинаковые

### **3. Безопасность:**
- **ADMIN_EMAIL**: ваш реальный Gmail
- **NEXTAUTH_SECRET**: одинаковый (или разные для безопасности)
- **ADMIN_API_KEY**: одинаковый (или разные для безопасности)

---

## **🚀 БЫСТРЫЙ СТАРТ:**

### **Для локальной разработки:**
1. Создайте `.env.local` с `NEXTAUTH_URL=http://localhost:3000`
2. Запустите `npm run dev`
3. Откройте http://localhost:3000

### **Для продакшена:**
1. Обновите `.env.local` на сервере с `NEXTAUTH_URL=http://YOUR_SERVER_IP_HERE:3000`
2. Перезапустите `pm2 restart all`
3. Откройте http://YOUR_SERVER_IP_HERE:3000

**Готово! Теперь у вас единая система авторизации для обеих сред!** 🎉
