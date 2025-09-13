# 🚀 Развертывание PromptHub на reg.ru

## 📋 Предварительные требования

1. Аккаунт на reg.ru с VPS/VDS сервером
2. Зарегистрированный домен
3. PostgreSQL база данных на reg.ru или внешнем хостинге

## 🔧 Настройка сервера

### 1. Подключение к серверу
```bash
ssh user@your-server.reg.ru
```

### 2. Установка Node.js 18+
```bash
# На Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверить версию
node --version
npm --version
```

### 3. Установка PM2 для управления процессами
```bash
sudo npm install -g pm2
```

### 4. Клонирование проекта
```bash
git clone https://github.com/your-repo/prompthub.git
cd prompthub
```

## 🗄️ Настройка базы данных

### На reg.ru PostgreSQL
1. Создайте базу данных в панели управления
2. Получите параметры подключения
3. Добавьте их в переменные окружения

## 🔐 Переменные окружения

Создайте файл `.env` в корне проекта:

```bash
# NextAuth
NEXTAUTH_URL=https://your-domain.reg.ru
NEXTAUTH_SECRET=ваш-случайный-секрет

# PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database_name

# Google OAuth
GOOGLE_CLIENT_ID=ваш-production-client-id
GOOGLE_CLIENT_SECRET=ваш-production-client-secret

# Production
NODE_ENV=production
AUTH_FORCE_TEST=0
```

## 🚀 Развертывание

### 1. Запуск скрипта развертывания
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 2. Настройка PM2
```bash
pm2 start npm --name "prompthub" -- start
pm2 save
pm2 startup
```

### 3. Настройка Nginx (если используется)
```nginx
server {
    listen 80;
    server_name your-domain.reg.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 Проверка развертывания

```bash
# Проверить статус PM2
pm2 status

# Просмотреть логи
pm2 logs prompthub

# Проверить приложение
curl http://localhost:3000
```

## 🔄 Обновление приложения

```bash
# Остановить приложение
pm2 stop prompthub

# Обновить код
git pull origin main

# Перезапустить развертывание
./scripts/deploy.sh

# Запустить приложение
pm2 start prompthub
```

## 🛠️ Устранение неполадок

### Распространенные проблемы:

1. **Ошибка подключения к БД**
   - Проверьте DATABASE_URL
   - Убедитесь что БД доступна с сервера

2. **OAuth не работает**
   - Проверьте production redirect URIs в Google
   - Убедитесь что NEXTAUTH_URL правильный

3. **Приложение не запускается**
   - Проверьте логи: `pm2 logs prompthub`
   - Убедитесь что все зависимости установлены

## 💰 Мониторинг и обслуживание

- Настройте логирование в reg.ru панели
- Мониторьте использование ресурсов
- Регулярно обновляйте зависимости
- Делайте бэкапы базы данных
