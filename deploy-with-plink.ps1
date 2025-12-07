# Деплой системы категорий с использованием Plink
Write-Host "🚀 ДЕПЛОЙ СИСТЕМЫ КАТЕГОРИЙ С PLINK" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Параметры подключения
$server = "YOUR_SERVER_IP_HERE"
$user = "root"
$password = "YOUR_PASSWORD_HERE"

Write-Host "`n1️⃣ Получение изменений с GitHub..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

Write-Host "`n2️⃣ Установка зависимостей..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npm ci"

Write-Host "`n3️⃣ Генерация Prisma клиента..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npx prisma generate"

Write-Host "`n4️⃣ Применение миграций..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npx prisma migrate deploy"

Write-Host "`n5️⃣ Заполнение категорий..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && node scripts/seed-categories.js"

Write-Host "`n6️⃣ Обновление счётчиков..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && node scripts/update-category-counts.js update"

Write-Host "`n7️⃣ Сборка проекта..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && npm run build"

Write-Host "`n8️⃣ Перезапуск приложения..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && pm2 restart prompthub"

Write-Host "`n9️⃣ Проверка статуса..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && pm2 status"

Write-Host "`n🔟 Проверка работы сайта..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$server/ru/prompts" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Сайт работает! Статус: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Предупреждение: не удалось проверить сайт" -ForegroundColor Red
}

Write-Host "`n🎉 ДЕПЛОЙ ЗАВЕРШЁН УСПЕШНО!" -ForegroundColor Green
Write-Host "`n📋 Проверьте следующие URL:" -ForegroundColor Cyan
Write-Host "   🏠 Главная: http://$server/ru/prompts" -ForegroundColor White
Write-Host "   ⚖️ Юристы: http://$server/ru/category/legal" -ForegroundColor White
Write-Host "   🏥 Врачи: http://$server/ru/category/health" -ForegroundColor White
Write-Host "   📚 Обучение: http://$server/ru/category/education" -ForegroundColor White
Write-Host "   📸 Фото: http://$server/ru/category/image" -ForegroundColor White
Write-Host "   🎬 Видео: http://$server/ru/category/video" -ForegroundColor White