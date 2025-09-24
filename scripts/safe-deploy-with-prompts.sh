#!/bin/bash

echo "🚀 Безопасный деплой с импортом промптов на сервер..."

# Проверяем, что мы на сервере
if [ ! -d "/root/prompthub" ]; then
    echo "❌ Ошибка: Директория /root/prompthub не найдена"
    echo "Убедитесь, что вы подключены к серверу и проект развернут"
    exit 1
fi

echo "📁 Переходим в директорию проекта..."
cd /root/prompthub

echo "📥 Получаем последние изменения из репозитория..."
git fetch origin
git reset --hard origin/main

echo "📦 Устанавливаем зависимости..."
npm install

echo "🔧 Генерируем Prisma клиент..."
npx prisma generate

echo "🗄️ Проверяем подключение к базе данных..."
npx prisma db push --accept-data-loss

echo "📋 Импортируем новые промпты..."
if [ -f "prompts_prompthub3.json" ]; then
    echo "✅ Файл prompts_prompthub3.json найден, импортируем промпты..."
    npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json
else
    echo "⚠️  Файл prompts_prompthub3.json не найден на сервере"
    echo "Скопируйте файл на сервер или импортируйте промпты вручную"
fi

echo "🏗️ Собираем приложение..."
npm run build

echo "🔄 Перезапускаем приложение..."
pm2 stop prompthub || true
pm2 delete prompthub || true
pm2 start ecosystem.config.js || pm2 start npm --name "prompthub" -- start
pm2 save

echo "✅ Деплой завершен!"
echo "🌐 Проверьте сайт: http://83.166.244.71:3000"
echo "📊 Проверьте API: http://83.166.244.71:3000/api/prompts?limit=5"
