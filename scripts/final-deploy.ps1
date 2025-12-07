# Финальный деплой на сервер
Write-Host "🚀 ФИНАЛЬНЫЙ ДЕПЛОЙ НА СЕРВЕР" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

$ServerIP = "YOUR_SERVER_IP_HERE"
$Username = "root"
$Password = "YOUR_PASSWORD_HERE"

Write-Host "🔌 Устанавливаем SSH соединение..." -ForegroundColor Yellow
$session = New-PSSession -HostName $ServerIP -UserName $Username -Password (ConvertTo-SecureString $Password -AsPlainText -Force)

if ($session) {
    Write-Host "✅ SSH сессия установлена" -ForegroundColor Green
    
    Write-Host "`n🚀 Выполняем деплой..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        cd /root/prompthub
        Write-Host "Обновляем код..." -ForegroundColor Yellow
        git fetch origin
        git reset --hard origin/main
        
        Write-Host "Устанавливаем зависимости..." -ForegroundColor Yellow
        npm install
        
        Write-Host "Обновляем Prisma..." -ForegroundColor Yellow
        npx prisma generate
        
        Write-Host "Обновляем базу данных..." -ForegroundColor Yellow
        npx prisma db push --accept-data-loss
        
        Write-Host "Импортируем промпты..." -ForegroundColor Yellow
        npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json
        
        Write-Host "Собираем приложение..." -ForegroundColor Yellow
        npm run build
        
        Write-Host "Перезапускаем приложение..." -ForegroundColor Yellow
        pm2 stop prompthub
        pm2 delete prompthub
        pm2 start ecosystem.config.js
        pm2 save
        
        Write-Host "Деплой завершен!" -ForegroundColor Green
    }
    
    Remove-PSSession $session
    Write-Host "`n🔌 SSH сессия закрыта" -ForegroundColor Gray
} else {
    Write-Host "❌ Не удалось установить SSH сессию" -ForegroundColor Red
}

# Проверка результата
Write-Host "`n🔍 ПРОВЕРКА РЕЗУЛЬТАТА..." -ForegroundColor Green
$response = Invoke-WebRequest -Uri "http://$ServerIP:3000/api/prompts?limit=10" -UseBasicParsing -TimeoutSec 10
$prompts = $response.Content | ConvertFrom-Json
Write-Host "✅ API работает. Найдено промптов: $($prompts.items.Count)" -ForegroundColor Green

# Проверяем наличие новых промптов
$newPrompts = $prompts.items | Where-Object { $_.title -like "*питание*" -or $_.title -like "*тренировка*" -or $_.title -like "*бюджет*" }
if ($newPrompts.Count -gt 0) {
    Write-Host "🎉 НОВЫЕ ПРОМПТЫ НАЙДЕНЫ НА САЙТЕ!" -ForegroundColor Green
    $newPrompts | ForEach-Object { Write-Host "  • $($_.title)" -ForegroundColor Cyan }
} else {
    Write-Host "⚠️  Новые промпты не найдены. Возможно, импорт не прошел." -ForegroundColor Yellow
}

Write-Host "`n🌐 Сайт: http://$ServerIP:3000" -ForegroundColor Cyan
Write-Host "📊 API: http://$ServerIP:3000/api/prompts?limit=10" -ForegroundColor Cyan
