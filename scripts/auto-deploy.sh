#!/bin/bash

echo "🚀 АВТОМАТИЧЕСКИЙ ДЕПЛОЙ НА ПРОДАКШЕН"
echo "===================================="

# Параметры сервера
SERVER_IP="83.166.244.71"
SERVER_USER="root"
SERVER_PASS="yqOdhMhP41s5827h"

echo "📡 Подключаемся к серверу $SERVER_IP..."

# Проверяем, установлен ли sshpass
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass не установлен. Устанавливаем..."
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "⚠️  На Windows нужно установить sshpass вручную"
        echo "Или используйте команды из manual-deploy-commands.txt"
        exit 1
    else
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

echo "🔧 Выполняем деплой на сервере..."

# Выполняем команды на сервере
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
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

echo "⏳ Ждем 15 секунд для запуска..."
sleep 15

echo "📊 Проверяем статус..."
pm2 status

echo "🔍 Проверяем API endpoints..."
curl -s https://prompt-hub.site/api/health || echo "Health check failed"
curl -s https://prompt-hub.site/api/stats || echo "Stats check failed"

echo "✅ Деплой завершен!"
EOF

echo "✅ Автоматический деплой завершен!"
echo "🔍 Проверяем результат..."

# Ждем немного и проверяем результат
sleep 10

echo "🧪 Тестируем API endpoints..."
node scripts/check-after-restart.js
