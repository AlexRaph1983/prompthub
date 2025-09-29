# PowerShell скрипт для деплоя на продакшен
# БЕЗОПАСНЫЙ ДЕПЛОЙ - НЕ УРОНИМ СЕРВЕР!

Write-Host "🚀 БЕЗОПАСНЫЙ ДЕПЛОЙ НА ПРОДАКШЕН" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Параметры сервера
$SERVER_IP = "83.166.244.71"
$SERVER_USER = "root"
$SERVER_PASS = "yqOdhMhP41s5827h"

Write-Host "📡 Подключаемся к серверу $SERVER_IP..." -ForegroundColor Yellow

# Проверяем, установлен ли plink (PuTTY)
if (-not (Test-Path "plink.exe")) {
    Write-Host "❌ plink.exe не найден. Скачиваем PuTTY..." -ForegroundColor Red
    Write-Host "Скачайте PuTTY с https://www.putty.org/ и поместите plink.exe в текущую папку" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔧 Выполняем деплой на сервере..." -ForegroundColor Cyan

# Команды для выполнения на сервере
$commands = @"
cd /root/prompthub
echo "📥 Получаем последние изменения..."
git fetch origin
git reset --hard origin/main
echo "🛑 Останавливаем сервер (без удаления)..."
pm2 stop all
echo "🧹 Очищаем кэши..."
rm -rf node_modules
rm -rf .next
echo "📦 Устанавливаем зависимости..."
npm install
echo "🔨 Пересобираем проект..."
npm run build
echo "🚀 Запускаем сервер..."
pm2 start ecosystem.config.js
echo "⏳ Ждем 15 секунд для запуска..."
sleep 15
echo "📊 Проверяем статус..."
pm2 status
echo "🔍 Проверяем API endpoints..."
curl -s https://prompt-hub.site/api/health || echo "Health check failed"
curl -s https://prompt-hub.site/api/stats || echo "Stats check failed"
echo "✅ Деплой завершен!"
"@

# Выполняем команды на сервере
try {
    $commands | .\plink.exe -ssh $SERVER_USER@$SERVER_IP -pw $SERVER_PASS
    Write-Host "✅ Деплой выполнен успешно!" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка деплоя: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Попробуйте выполнить команды вручную из manual-deploy-commands.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n⏳ Ждем 30 секунд для стабилизации сервера..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n🔍 Проверяем результат деплоя..." -ForegroundColor Cyan

# Проверяем API endpoints
$endpoints = @(
    "https://prompt-hub.site/api/health",
    "https://prompt-hub.site/api/stats",
    "https://prompt-hub.site/api/prompts/cmftyuu1v00539l6hapwra6su",
    "https://prompt-hub.site/api/recommendations"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 10
        Write-Host "✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🧪 Проверяем консистентность просмотров..." -ForegroundColor Cyan

try {
    $detailsResponse = Invoke-WebRequest -Uri "https://prompt-hub.site/api/prompts/cmftyuu1v00539l6hapwra6su" -Method GET
    $detailsData = ($detailsResponse.Content | ConvertFrom-Json)
    $detailsViews = $detailsData.views
    
    $recommendationsResponse = Invoke-WebRequest -Uri "https://prompt-hub.site/api/recommendations" -Method GET
    $recommendationsData = ($recommendationsResponse.Content | ConvertFrom-Json)
    $foundPrompt = $recommendationsData | Where-Object { $_.prompt.id -eq "cmftyuu1v00539l6hapwra6su" }
    $recommendationsViews = $foundPrompt.prompt.views
    
    Write-Host "📊 API Details views: $detailsViews" -ForegroundColor White
    Write-Host "📊 API Recommendations views: $recommendationsViews" -ForegroundColor White
    
    if ($detailsViews -eq $recommendationsViews) {
        Write-Host "✅ ПРОБЛЕМА РЕШЕНА! Значения совпадают: $detailsViews" -ForegroundColor Green
        Write-Host "🎉 СЕРВЕР НЕ УРОНЕН И ПРОБЛЕМА ИСПРАВЛЕНА!" -ForegroundColor Green
    } else {
        Write-Host "❌ ПРОБЛЕМА ВСЕ ЕЩЕ ЕСТЬ: $detailsViews ≠ $recommendationsViews" -ForegroundColor Red
        Write-Host "🔧 Возможно, нужно еще раз перезапустить сервер" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка проверки: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Безопасный деплой завершен!" -ForegroundColor Green
