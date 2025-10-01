@echo off
echo 🚀 ДЕПЛОЙ ПАГИНАЦИИ НА ПРОДАКШЕН
echo ================================

echo 📡 Подключаемся к серверу...
plink.exe -ssh root@83.166.244.71 -pw yqOdhMhP41s5827h -batch "cd /root/prompthub && echo '📥 Получаем изменения...' && git fetch origin && git reset --hard origin/main && echo '🛑 Останавливаем сервер...' && pm2 stop all && echo '🧹 Очищаем кэши...' && rm -rf node_modules && rm -rf .next && echo '📦 Устанавливаем зависимости...' && npm install && echo '🔨 Собираем проект...' && npm run build && echo '🚀 Запускаем сервер...' && pm2 start ecosystem.config.js && echo '⏳ Ждем 15 секунд...' && sleep 15 && echo '📊 Проверяем статус...' && pm2 status && echo '✅ Деплой завершен!'"

echo.
echo 🔍 Проверяем результат...
curl -s https://prompt-hub.site/api/prompts?limit=50
echo.
echo ✅ Деплой пагинации завершен!
pause



