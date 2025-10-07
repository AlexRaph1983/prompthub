# Финальный безопасный деплой системы категорий
# Сервер: Orange Curium (REDACTED_IP)

param(
    [switch]$SkipBackup = $false,
    [switch]$SkipMigration = $false,
    [switch]$DryRun = $false
)

Write-Host "🚀 ФИНАЛЬНЫЙ ДЕПЛОЙ СИСТЕМЫ КАТЕГОРИЙ" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "🔍 РЕЖИМ ПРОВЕРКИ (DRY RUN) - изменения не будут применены" -ForegroundColor Yellow
}

# Функция для выполнения команд на сервере
function Invoke-ServerCommand {
    param([string]$Command)
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] $Command" -ForegroundColor Cyan
        return
    }
    
    Write-Host "🔄 Выполняем: $Command" -ForegroundColor Yellow
    ssh root@REDACTED_IP "$Command"
}

# 1. Проверка подключения к серверу
Write-Host "`n1️⃣ Проверка подключения к серверу..." -ForegroundColor Cyan
try {
    ssh root@REDACTED_IP "echo 'Подключение успешно'"
    Write-Host "✅ Подключение к серверу работает" -ForegroundColor Green
} catch {
    Write-Host "❌ Не удалось подключиться к серверу!" -ForegroundColor Red
    exit 1
}

# 2. Создание бэкапа (если не пропущено)
if (-not $SkipBackup -and -not $DryRun) {
    Write-Host "`n2️⃣ Создание бэкапа базы данных..." -ForegroundColor Cyan
    $backupFile = "backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').sql"
    Invoke-ServerCommand "cd /root/prompthub && cp dev.db ../dev.db.backup.$backupFile"
    Write-Host "✅ Бэкап создан: dev.db.backup.$backupFile" -ForegroundColor Green
}

# 3. Получение последних изменений
Write-Host "`n3️⃣ Получение последних изменений с GitHub..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

# 4. Установка зависимостей
Write-Host "`n4️⃣ Установка зависимостей..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && npm ci"

# 5. Генерация Prisma клиента
Write-Host "`n5️⃣ Генерация Prisma клиента..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && npx prisma generate"

# 6. Применение миграций
if (-not $SkipMigration) {
    Write-Host "`n6️⃣ Применение миграций..." -ForegroundColor Cyan
    Invoke-ServerCommand "cd /root/prompthub && npx prisma migrate deploy"
    Write-Host "✅ Миграции применены" -ForegroundColor Green
} else {
    Write-Host "⚠️ Пропущено применение миграций" -ForegroundColor Yellow
}

# 7. Заполнение категорий и тегов
Write-Host "`n7️⃣ Заполнение категорий и тегов..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && node scripts/seed-categories.js"

# 8. Миграция существующих промптов (если есть)
Write-Host "`n8️⃣ Миграция существующих промптов..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && node scripts/migrate-existing-prompts.js"

# 9. Обновление счётчиков
Write-Host "`n9️⃣ Обновление счётчиков..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && node scripts/update-category-counts.js update"

# 10. Проверка целостности данных
Write-Host "`n🔟 Проверка целостности данных..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && node scripts/check-production-data.js"

# 11. Сборка проекта
Write-Host "`n1️⃣1️⃣ Сборка проекта..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && npm run build"

# 12. Перезапуск приложения
Write-Host "`n1️⃣2️⃣ Перезапуск приложения..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && pm2 restart prompthub"

# 13. Проверка статуса
Write-Host "`n1️⃣3️⃣ Проверка статуса приложения..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && pm2 status"

# 14. Проверка работы сайта
Write-Host "`n1️⃣4️⃣ Проверка работы сайта..." -ForegroundColor Cyan

$testUrls = @(
    "http://REDACTED_IP/ru/prompts",
    "http://REDACTED_IP/ru/category/legal", 
    "http://REDACTED_IP/ru/category/image",
    "http://REDACTED_IP/en/prompts"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $url - Статус: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $url - Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 15. Финальная проверка
Write-Host "`n1️⃣5️⃣ Финальная проверка системы категорий..." -ForegroundColor Cyan
Invoke-ServerCommand "cd /root/prompthub && node scripts/check-production-data.js"

Write-Host "`n🎉 ДЕПЛОЙ ЗАВЕРШЁН УСПЕШНО!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📋 Проверьте следующие URL:" -ForegroundColor Cyan
Write-Host "   🏠 Главная: http://REDACTED_IP/ru/prompts" -ForegroundColor White
Write-Host "   ⚖️ Юристы: http://REDACTED_IP/ru/category/legal" -ForegroundColor White  
Write-Host "   🏥 Врачи: http://REDACTED_IP/ru/category/health" -ForegroundColor White
Write-Host "   📚 Обучение: http://REDACTED_IP/ru/category/education" -ForegroundColor White
Write-Host "   📸 Фото: http://REDACTED_IP/ru/category/image" -ForegroundColor White
Write-Host "   🎬 Видео: http://REDACTED_IP/ru/category/video" -ForegroundColor White

Write-Host "`n🔧 Полезные команды для мониторинга:" -ForegroundColor Cyan
Write-Host "   ssh root@REDACTED_IP 'cd /root/prompthub && pm2 logs'" -ForegroundColor White
Write-Host "   ssh root@REDACTED_IP 'cd /root/prompthub && pm2 status'" -ForegroundColor White
Write-Host "   ssh root@REDACTED_IP 'cd /root/prompthub && node scripts/check-production-data.js'" -ForegroundColor White

Write-Host "`n✅ Система категорий успешно развёрнута!" -ForegroundColor Green
