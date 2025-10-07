# Простой деплой с Plink
Write-Host "🚀 ДЕПЛОЙ СИСТЕМЫ КАТЕГОРИЙ" -ForegroundColor Green

$server = "83.166.244.71"
$user = "root"
$password = "yqOdhMhP41s5827h"

Write-Host "`n1️⃣ Получение изменений..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

Write-Host "`n2️⃣ Установка зависимостей..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npm ci"

Write-Host "`n3️⃣ Генерация Prisma..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npx prisma generate"

Write-Host "`n4️⃣ Миграции..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npx prisma migrate deploy"

Write-Host "`n5️⃣ Заполнение категорий..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && node scripts/seed-categories.js"

Write-Host "`n6️⃣ Обновление счётчиков..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && node scripts/update-category-counts.js update"

Write-Host "`n7️⃣ Сборка..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npm run build"

Write-Host "`n8️⃣ Перезапуск..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && pm2 restart prompthub"

Write-Host "`n9️⃣ Статус..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && pm2 status"

Write-Host "`n🎉 ДЕПЛОЙ ЗАВЕРШЁН!" -ForegroundColor Green
Write-Host "`nПроверьте: http://$server/ru/prompts" -ForegroundColor Cyan
