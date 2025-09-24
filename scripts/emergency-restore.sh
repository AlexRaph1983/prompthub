#!/bin/bash

echo "🚨 ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ САЙТА"
echo "================================="

# Переходим в директорию проекта
cd /root/prompthub || exit 1

echo "1. Диагностика текущего состояния..."
pm2 status
echo "Логи приложения:"
pm2 logs prompthub --lines 10

echo "2. Остановка всех процессов..."
pm2 stop all
pm2 delete all
pkill -f node 2>/dev/null || true

echo "3. Проверка состояния репозитория..."
git status

echo "4. Быстрая установка зависимостей..."
npm install

echo "5. Генерация Prisma клиента..."
npx prisma generate

echo "6. Попытка запуска приложения..."
if [ -f "ecosystem.config.js" ]; then
    echo "Запуск через ecosystem.config.js..."
    pm2 start ecosystem.config.js
else
    echo "Прямой запуск через npm..."
    pm2 start npm --name "prompthub" -- start
fi

echo "7. Проверка результата..."
sleep 5
pm2 status

echo "8. Тест подключения..."
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Сайт восстановлен!"
    pm2 save
else
    echo "❌ Сайт не отвечает, пробуем альтернативный запуск..."
    pm2 stop prompthub
    pm2 delete prompthub
    pm2 start "npm start" --name prompthub
    sleep 5
    curl -s http://localhost:3000 > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Сайт восстановлен альтернативным способом!"
        pm2 save
    else
        echo "❌ Не удалось восстановить сайт автоматически"
        echo "Проверьте логи: pm2 logs prompthub"
    fi
fi

echo "9. Финальная проверка..."
pm2 status
echo "Сайт должен быть доступен по адресу: http://REDACTED_IP:3000"
