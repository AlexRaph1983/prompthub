# 🔐 НАСТРОЙКА GOOGLE OAUTH ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ

### **Шаг 1: Создайте .env.local файл**

Создайте файл `.env.local` в корне проекта со следующим содержимым:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=D7Seqs48GNrIx519i7S8WqyQBoAwLiImJkegciWv/nU=

# Google OAuth (используйте ваши credentials)
GOOGLE_CLIENT_ID=ваш-client-id-здесь
GOOGLE_CLIENT_SECRET=ваш-client-secret-здесь

# Admin Configuration  
ADMIN_EMAIL=ваш-email@gmail.com
ADMIN_API_KEY=admin-secret-key-2024

# Database
DATABASE_URL="file:./dev.db"

# Auth debug/testing
AUTH_FORCE_TEST=0
```

### **Шаг 2: Настройте Google Cloud Console**

#### 2.1 Создайте проект
1. Перейдите на: https://console.cloud.google.com/
2. Создайте новый проект: "PromptHub Local"
3. Выберите созданный проект

#### 2.2 Включите Google+ API
1. **APIs & Services** → **Library**
2. Найдите **"Google+ API"** 
3. Нажмите **"Enable"**

#### 2.3 Создайте OAuth consent screen
1. **APIs & Services** → **OAuth consent screen**
2. **User Type**: External
3. **App name**: PromptHub
4. **User support email**: ваш email
5. **Developer contact**: ваш email
6. **Save & Continue** → **Save & Continue** → **Save & Continue**

#### 2.4 Создайте OAuth 2.0 credentials
1. **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: PromptHub Local
5. **Authorized redirect URIs** добавьте:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000
   ```
6. **Save**

#### 2.5 Скопируйте credentials
После создания вы получите:
- **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnop`

### **Шаг 3: Обновите .env.local**

Замените в `.env.local`:
```bash
GOOGLE_CLIENT_ID=ваш-реальный-client-id
GOOGLE_CLIENT_SECRET=ваш-реальный-client-secret
ADMIN_EMAIL=ваш-реальный-email@gmail.com
```

### **Шаг 4: Запустите локальный сервер**

```bash
# Установите зависимости (если еще не установлены)
npm install

# Запустите базу данных
npx prisma db push

# Запустите сервер разработки
npm run dev
```

### **Шаг 5: Протестируйте авторизацию**

1. Откройте: http://localhost:3000
2. Нажмите **"Войти"** в правом верхнем углу
3. Выберите **"Sign in with Google"**
4. Войдите с вашим Google аккаунтом
5. После успешного входа перейдите на: http://localhost:3000/admin

## 🎯 **ЧТО ПОЛУЧИТЕ:**

- ✅ **Локальная авторизация** через Google
- ✅ **Доступ к админ-панели** на localhost:3000/admin
- ✅ **Полная функциональность** как на продакшене
- ✅ **Отладка и разработка** в локальной среде

## 🔧 **ВАЖНЫЕ МОМЕНТЫ:**

1. **Redirect URI** должен точно совпадать: `http://localhost:3000/api/auth/callback/google`
2. **NEXTAUTH_URL** должен быть: `http://localhost:3000`
3. **ADMIN_EMAIL** должен совпадать с email вашего Google аккаунта
4. После изменения `.env.local` перезапустите сервер: `npm run dev`

## 🚨 **ЕСЛИ НЕ РАБОТАЕТ:**

1. Проверьте, что все URLs в Google Console точно совпадают
2. Убедитесь, что Google+ API включен
3. Проверьте, что OAuth consent screen настроен
4. Перезапустите сервер после изменения .env.local
5. Очистите кэш браузера

## 📞 **ПОДДЕРЖКА:**

Если возникнут проблемы - проверьте:
- Консоль браузера на ошибки
- Терминал на ошибки сервера
- Google Cloud Console на правильность настроек

**Готово! Теперь у вас есть полнофункциональная локальная разработка с Google OAuth!** 🚀
