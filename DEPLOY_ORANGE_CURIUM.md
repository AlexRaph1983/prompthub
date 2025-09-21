# 🚀 Деплой на сервер Orange Curium

## 📋 Информация о сервере
- **IP адрес**: 83.166.244.71
- **Логин**: root
- **Пароль**: yqOdhMhP41s5827h
- **Порт приложения**: 3000

## 🔧 Подготовка сервера

### 1. Подключение к серверу
```bash
ssh root@83.166.244.71
# Введите пароль: yqOdhMhP41s5827h
```

### 2. Установка необходимого ПО
```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Установка PM2
npm install -g pm2

# Установка Git (если не установлен)
apt install -y git

# Проверка версий
node --version
npm --version
pm2 --version
```

### 3. Клонирование репозитория
```bash
cd /root
git clone https://github.com/your-username/prompthub.git
cd prompthub
```

### 4. Настройка переменных окружения
```bash
# Создание .env файла
nano .env
```

Добавьте следующие переменные:
```env
# NextAuth
NEXTAUTH_URL=http://83.166.244.71:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database (настройте под вашу БД)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Google OAuth (production credentials)
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret

# Production
NODE_ENV=production
AUTH_FORCE_TEST=0
```

## 🚀 Деплой приложения

### Автоматический деплой
```bash
# Запуск скрипта деплоя
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Ручной деплой (если автоматический не работает)
```bash
# Установка зависимостей
npm install

# Миграции базы данных
npx prisma migrate deploy

# Генерация Prisma клиента
npx prisma generate

# Сборка приложения
npm run build

# Запуск через PM2
pm2 start npm --name "prompthub" -- start
pm2 save
pm2 startup
```

## 🔍 Проверка деплоя

```bash
# Проверка статуса PM2
pm2 status

# Просмотр логов
pm2 logs prompthub

# Проверка работы приложения
curl http://localhost:3000

# Проверка извне
curl http://83.166.244.71:3000
```

## 🔄 Обновление приложения

```bash
# Подключение к серверу
ssh root@83.166.244.71

# Переход в директорию проекта
cd /root/prompthub

# Обновление кода
git fetch origin
git reset --hard origin/main

# Перезапуск деплоя
bash scripts/deploy.sh
```

## 🛠️ Устранение неполадок

### Если приложение не запускается:
```bash
# Проверка логов
pm2 logs prompthub

# Перезапуск
pm2 restart prompthub

# Проверка портов
netstat -tlnp | grep 3000
```

### Если не хватает памяти:
```bash
# Проверка использования памяти
free -h
df -h

# Очистка кэша
npm cache clean --force
rm -rf node_modules/.cache
```

### Если проблемы с базой данных:
```bash
# Проверка подключения к БД
npx prisma db pull

# Сброс миграций (ОСТОРОЖНО!)
npx prisma migrate reset
```

## 🌐 Настройка домена (опционально)

Если у вас есть домен, настройте Nginx:

```bash
# Установка Nginx
apt install -y nginx

# Создание конфигурации
nano /etc/nginx/sites-available/prompthub
```

Конфигурация Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активация конфигурации:
```bash
ln -s /etc/nginx/sites-available/prompthub /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs prompthub`
2. Проверьте статус: `pm2 status`
3. Проверьте доступность порта: `curl http://localhost:3000`
4. Обратитесь к документации проекта



