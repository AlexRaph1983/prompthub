# Безопасный деплой пагинации БЕЗ миграций
param(
    [string]$ServerIP = "YOUR_SERVER_IP_HERE",
    [string]$Username = "root",
    [string]$Password = "YOUR_PASSWORD_HERE"
)

Write-Host "🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ ПАГИНАЦИИ" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "БЕЗ МИГРАЦИЙ И ИМПОРТОВ!" -ForegroundColor Yellow

# Создаем сессию SSH
Write-Host "🔌 Устанавливаем SSH соединение..." -ForegroundColor Yellow
$session = New-PSSession -HostName $ServerIP -UserName $Username -Password (ConvertTo-SecureString $Password -AsPlainText -Force)

if ($session) {
    Write-Host "✅ SSH сессия установлена" -ForegroundColor Green
    
    try {
        # Выполняем только безопасные команды деплоя
        Write-Host "`n🚀 Выполняем безопасный деплой..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            Write-Host "📥 Получаем последние изменения..." -ForegroundColor Yellow
            git fetch origin
            git reset --hard origin/main
            
            Write-Host "🛑 Останавливаем приложение..." -ForegroundColor Yellow
            pm2 stop prompthub 2>$null
            
            Write-Host "🧹 Очищаем кэши..." -ForegroundColor Yellow
            rm -rf node_modules
            rm -rf .next
            
            Write-Host "📦 Устанавливаем зависимости..." -ForegroundColor Yellow
            npm install
            
            Write-Host "🔨 Собираем приложение..." -ForegroundColor Yellow
            npm run build
            
            Write-Host "🚀 Запускаем приложение..." -ForegroundColor Yellow
            pm2 start ecosystem.config.js
            
            Write-Host "💾 Сохраняем конфигурацию PM2..." -ForegroundColor Yellow
            pm2 save
            
            Write-Host "⏳ Ждем 10 секунд для запуска..." -ForegroundColor Yellow
            sleep 10
            
            Write-Host "📊 Проверяем статус..." -ForegroundColor Yellow
            pm2 status
            
            Write-Host "✅ Деплой завершен!" -ForegroundColor Green
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
    $response = Invoke-WebRequest -Uri "https://prompt-hub.site/api/prompts?limit=50" -UseBasicParsing -TimeoutSec 15
    $prompts = $response.Content | ConvertFrom-Json
    Write-Host "✅ API работает. Загружено промптов: $($prompts.items.Count)" -ForegroundColor Green
    Write-Host "✅ Пагинация: hasMore = $($prompts.hasMore), nextCursor = $($prompts.nextCursor)" -ForegroundColor Green
    
    # Проверяем пагинацию
    if ($prompts.items.Count -eq 50) {
        Write-Host "🎉 ПАГИНАЦИЯ РАБОТАЕТ! Загружено ровно 50 промптов" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Загружено $($prompts.items.Count) промптов вместо 50" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка при проверке API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🌐 Сайт: https://prompt-hub.site" -ForegroundColor Cyan
Write-Host "📊 API: https://prompt-hub.site/api/prompts?limit=50" -ForegroundColor Cyan
Write-Host "✅ Безопасный деплой пагинации завершен!" -ForegroundColor Green



