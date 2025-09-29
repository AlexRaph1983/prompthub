#!/bin/bash

echo "🚀 ПЕРЕЗАПУСК СЕРВЕРА НА ПРОДАКШЕНЕ"
echo "=================================="

# Переходим в директорию проекта
cd /root/prompthub

echo "📥 Получаем последние изменения..."
git fetch origin
git reset --hard origin/main

echo "🛑 Останавливаем текущий сервер..."
pm2 stop all
pm2 delete all

echo "🧹 Очищаем кэши и зависимости..."
rm -rf node_modules
rm -rf .next

echo "📦 Устанавливаем зависимости..."
npm install

echo "🔨 Пересобираем проект..."
npm run build

echo "🚀 Запускаем сервер..."
pm2 start ecosystem.config.js

echo "📊 Проверяем статус..."
pm2 status

echo "⏳ Ждем 10 секунд для запуска..."
sleep 10

echo "🔍 Проверяем API endpoints..."
curl -s https://prompt-hub.site/api/health | jq .
curl -s https://prompt-hub.site/api/stats | jq .

echo "✅ Перезапуск завершен!"
echo "🔧 Проверьте логи: pm2 logs"
