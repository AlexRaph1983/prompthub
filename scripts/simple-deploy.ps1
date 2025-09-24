# Простой деплой на сервер
param(
    [string]$ServerIP = "83.166.244.71",
    [string]$Username = "root",
    [string]$Password = "yqOdhMhP41s5827h"
)

Write-Host "🚀 ПРОСТОЙ ДЕПЛОЙ НА СЕРВЕР" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Создаем сессию SSH
Write-Host "🔌 Устанавливаем SSH соединение..." -ForegroundColor Yellow
$session = New-PSSession -HostName $ServerIP -UserName $Username -Password (ConvertTo-SecureString $Password -AsPlainText -Force)

if ($session) {
    Write-Host "✅ SSH сессия установлена" -ForegroundColor Green
    
    try {
        # Выполняем все команды деплоя
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
            pm2 stop prompthub 2>$null
            pm2 delete prompthub 2>$null
            pm2 start ecosystem.config.js 2>$null || pm2 start npm --name "prompthub" -- start
            
            Write-Host "Сохраняем конфигурацию..." -ForegroundColor Yellow
            pm2 save
            
            Write-Host "Деплой завершен!" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Ошибка при выполнении деплоя: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        Remove-PSSession $session
        Write-Host "`n🔌 SSH сессия закрыта" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Не удалось установить SSH сессию" -ForegroundColor Red
}

# Проверка результата
Write-Host "`n🔍 ПРОВЕРКА РЕЗУЛЬТАТА..." -ForegroundColor Green
try {
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
} catch {
    Write-Host "❌ Ошибка при проверке API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🌐 Сайт: http://$ServerIP:3000" -ForegroundColor Cyan
Write-Host "📊 API: http://$ServerIP:3000/api/prompts?limit=10" -ForegroundColor Cyan
