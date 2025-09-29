# PowerShell скрипт для перезапуска продакшена
# Запускать от имени администратора

Write-Host "🚀 ПЕРЕЗАПУСК ПРОДАКШЕНА" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# 1. Подключение к серверу и выполнение команд
Write-Host "`n🔗 Подключаемся к серверу..." -ForegroundColor Yellow

$sshCommands = @"
cd /root/prompthub
git fetch origin
git reset --hard origin/main
pm2 stop all
pm2 delete all
rm -rf node_modules
rm -rf .next
npm install
npm run build
pm2 start ecosystem.config.js
pm2 status
"@

Write-Host "`n📋 Выполняем команды на сервере:" -ForegroundColor Cyan
Write-Host $sshCommands -ForegroundColor Gray

Write-Host "`n⚠️  ВНИМАНИЕ: Выполните эти команды вручную на сервере!" -ForegroundColor Red
Write-Host "1. Подключитесь к серверу: ssh root@prompt-hub.site" -ForegroundColor White
Write-Host "2. Выполните команды выше по порядку" -ForegroundColor White
Write-Host "3. Проверьте статус: pm2 status" -ForegroundColor White

# 2. Ожидание и проверка
Write-Host "`n⏳ После выполнения команд на сервере, нажмите Enter для проверки..." -ForegroundColor Yellow
Read-Host

# 3. Проверка API
Write-Host "`n🔍 Проверяем API endpoints..." -ForegroundColor Cyan

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

# 4. Финальная проверка консистентности
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
    } else {
        Write-Host "❌ ПРОБЛЕМА ВСЕ ЕЩЕ ЕСТЬ: $detailsViews ≠ $recommendationsViews" -ForegroundColor Red
        Write-Host "🔧 Возможно, нужно еще раз перезапустить сервер" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка проверки: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Перезапуск завершен!" -ForegroundColor Green
