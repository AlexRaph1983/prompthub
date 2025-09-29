#!/bin/bash

echo "🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ НА ПРОДАКШЕН"
echo "================================"

# IP сервера
SERVER_IP="REDACTED_IP"
SERVER_USER="root"
SERVER_PASS="REDACTED_PASSWORD"

echo "📡 Подключаемся к серверу $SERVER_IP..."

# Создаем скрипт для выполнения на сервере
cat > deploy-script.sh << 'EOF'
#!/bin/bash

echo "🔧 ВЫПОЛНЕНИЕ НА СЕРВЕРЕ"
echo "======================"

# Переходим в директорию проекта
cd /root/prompthub

echo "📥 Получаем последние изменения..."
git fetch origin
git reset --hard origin/main

echo "🛑 Останавливаем сервер (без удаления)..."
pm2 stop all

echo "🧹 Очищаем кэши..."
rm -rf node_modules
rm -rf .next

echo "📦 Устанавливаем зависимости..."
npm install

echo "🔨 Пересобираем проект..."
npm run build

echo "🚀 Запускаем сервер..."
pm2 start ecosystem.config.js

echo "⏳ Ждем 10 секунд для запуска..."
sleep 10

echo "📊 Проверяем статус..."
pm2 status

echo "🔍 Проверяем API endpoints..."
curl -s https://prompt-hub.site/api/health | jq . || echo "Health check failed"
curl -s https://prompt-hub.site/api/stats | jq . || echo "Stats check failed"

echo "✅ Деплой завершен!"
EOF

# Копируем скрипт на сервер
echo "📤 Копируем скрипт на сервер..."
sshpass -p "$SERVER_PASS" scp deploy-script.sh $SERVER_USER@$SERVER_IP:/root/

# Выполняем скрипт на сервере
echo "▶️  Выполняем деплой на сервере..."
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_IP "chmod +x /root/deploy-script.sh && /root/deploy-script.sh"

# Очищаем временный файл
rm deploy-script.sh

echo "✅ Безопасный деплой завершен!"
