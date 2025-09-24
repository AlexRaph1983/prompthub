#!/bin/bash

echo "🚀 ЗАВЕРШЕНИЕ ДЕПЛОЯ НА СЕРВЕРЕ"
echo "==============================="

echo "1. Обновляем код с исправлением..."
cd /root/prompthub
git fetch origin
git reset --hard origin/main

echo "2. Устанавливаем зависимости..."
npm install

echo "3. Обновляем Prisma..."
npx prisma generate

echo "4. Обновляем базу данных..."
npx prisma db push --accept-data-loss

echo "5. Импортируем промпты..."
npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json

echo "6. Собираем приложение..."
npm run build

echo "7. Перезапускаем приложение..."
pm2 stop prompthub || true
pm2 delete prompthub || true
pm2 start ecosystem.config.js || pm2 start npm --name "prompthub" -- start

echo "8. Сохраняем конфигурацию..."
pm2 save

echo "✅ ДЕПЛОЙ ЗАВЕРШЕН!"
echo "🌐 Сайт: http://83.166.244.71:3000"
echo "📊 API: http://83.166.244.71:3000/api/prompts?limit=10"
