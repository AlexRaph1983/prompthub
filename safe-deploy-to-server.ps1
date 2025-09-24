# Безопасный деплой на сервер с импортом промптов
Write-Host "🚀 Безопасный деплой на сервер с импортом промптов..." -ForegroundColor Green

# Информация о сервере
$serverIP = "83.166.244.71"
$serverUser = "root"
$serverPassword = "yqOdhMhP41s5827h"

Write-Host "`n📋 Информация о сервере:" -ForegroundColor Yellow
Write-Host "IP: $serverIP" -ForegroundColor White
Write-Host "Пользователь: $serverUser" -ForegroundColor White

Write-Host "`n🔧 Пошаговая инструкция для деплоя:" -ForegroundColor Green

Write-Host "`n1️⃣ Подключение к серверу:" -ForegroundColor Cyan
Write-Host "ssh $serverUser@$serverIP" -ForegroundColor White
Write-Host "Пароль: $serverPassword" -ForegroundColor Gray

Write-Host "`n2️⃣ Выполнение команд на сервере:" -ForegroundColor Cyan
Write-Host "cd /root/prompthub" -ForegroundColor White
Write-Host "git fetch origin" -ForegroundColor White
Write-Host "git reset --hard origin/main" -ForegroundColor White
Write-Host "npm install" -ForegroundColor White
Write-Host "npx prisma generate" -ForegroundColor White
Write-Host "npx prisma db push --accept-data-loss" -ForegroundColor White

Write-Host "`n3️⃣ Импорт промптов (если файл есть на сервере):" -ForegroundColor Cyan
Write-Host "npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json" -ForegroundColor White

Write-Host "`n4️⃣ Сборка и перезапуск:" -ForegroundColor Cyan
Write-Host "npm run build" -ForegroundColor White
Write-Host "pm2 stop prompthub || true" -ForegroundColor White
Write-Host "pm2 delete prompthub || true" -ForegroundColor White
Write-Host "pm2 start ecosystem.config.js || pm2 start npm --name 'prompthub' -- start" -ForegroundColor White
Write-Host "pm2 save" -ForegroundColor White

Write-Host "`n⚠️  ВАЖНЫЕ ЗАМЕЧАНИЯ:" -ForegroundColor Red
Write-Host "• Убедитесь, что файл prompts_prompthub3.json есть на сервере" -ForegroundColor Yellow
Write-Host "• Если файла нет, скопируйте его на сервер" -ForegroundColor Yellow
Write-Host "• Проверьте, что база данных доступна" -ForegroundColor Yellow
Write-Host "• При ошибках проверьте логи: pm2 logs prompthub" -ForegroundColor Yellow

Write-Host "`n🔍 Проверка после деплоя:" -ForegroundColor Green
Write-Host "• Сайт: http://$serverIP:3000" -ForegroundColor White
Write-Host "• API: http://$serverIP:3000/api/prompts?limit=5" -ForegroundColor White
Write-Host "• Статус: pm2 status" -ForegroundColor White

Write-Host "`n📞 Если возникнут проблемы:" -ForegroundColor Magenta
Write-Host "• Проверьте логи: pm2 logs prompthub" -ForegroundColor White
Write-Host "• Проверьте статус: pm2 status" -ForegroundColor White
Write-Host "• Перезапустите: pm2 restart prompthub" -ForegroundColor White
