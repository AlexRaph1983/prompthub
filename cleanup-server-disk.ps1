# Скрипт для анализа и безопасной очистки диска на сервере
# Использование: .\cleanup-server-disk.ps1

$ErrorActionPreference = "Stop"

# Загружаем credentials
if (Test-Path "deploy-credentials.ps1") {
    . .\deploy-credentials.ps1
} else {
    Write-Host "ERROR: deploy-credentials.ps1 not found!" -ForegroundColor Red
    Write-Host "Please create it from deploy-credentials.example.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not $env:DEPLOY_PASSWORD -or -not $env:DEPLOY_SERVER) {
    Write-Host "ERROR: Credentials not loaded!" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧹 АНАЛИЗ И ОЧИСТКА ДИСКА НА СЕРВЕРЕ" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Сервер: $env:DEPLOY_SERVER" -ForegroundColor Yellow
Write-Host ""

# Путь к plink
$plinkPath = if (Test-Path ".\plink.exe") { ".\plink.exe" } 
            elseif (Test-Path "D:\PromptHub\plink.exe") { "D:\PromptHub\plink.exe" }
            else { "plink.exe" }

# Проверяем наличие plink
if (-not (Test-Path $plinkPath)) {
    Write-Host "ERROR: plink.exe not found!" -ForegroundColor Red
    Write-Host "Please download plink.exe and place it in the project root" -ForegroundColor Yellow
    exit 1
}

# Загружаем скрипты на сервер
Write-Host "📤 Загрузка скриптов на сервер..." -ForegroundColor Green

$analyzeScript = Get-Content "scripts/analyze-disk-usage.sh" -Raw
$cleanupScript = Get-Content "scripts/safe-cleanup.sh" -Raw

# Создаем временные файлы на сервере
$uploadCmd = @"
cat > /tmp/analyze-disk-usage.sh << 'ANALYZE_EOF'
$analyzeScript
ANALYZE_EOF
chmod +x /tmp/analyze-disk-usage.sh

cat > /tmp/safe-cleanup.sh << 'CLEANUP_EOF'
$cleanupScript
CLEANUP_EOF
chmod +x /tmp/safe-cleanup.sh

echo "Scripts uploaded"
"@

& $plinkPath -ssh -batch -pw $env:DEPLOY_PASSWORD "root@$env:DEPLOY_SERVER" $uploadCmd | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to upload scripts!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Скрипты загружены" -ForegroundColor Green
Write-Host ""

# ШАГ 1: АНАЛИЗ
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 ШАГ 1: АНАЛИЗ ДИСКОВОГО ПРОСТРАНСТВА" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$analyzeCmd = "bash /tmp/analyze-disk-usage.sh"
& $plinkPath -ssh -batch -pw $env:DEPLOY_PASSWORD "root@$env:DEPLOY_SERVER" $analyzeCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Analysis failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Нажмите любую клавишу для продолжения с очисткой..." -ForegroundColor Yellow
Write-Host "Или Ctrl+C для отмены" -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# ШАГ 2: ОЧИСТКА
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧹 ШАГ 2: БЕЗОПАСНАЯ ОЧИСТКА" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$cleanupCmd = "bash /tmp/safe-cleanup.sh"
& $plinkPath -ssh -batch -pw $env:DEPLOY_PASSWORD "root@$env:DEPLOY_SERVER" $cleanupCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cleanup failed!" -ForegroundColor Red
    exit 1
}

# Финальная проверка
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ ОЧИСТКА ЗАВЕРШЕНА" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Проверяем финальное состояние диска
Write-Host "📊 ФИНАЛЬНОЕ СОСТОЯНИЕ ДИСКА:" -ForegroundColor Cyan
$finalCheckCmd = "df -h / | tail -1"
& $plinkPath -ssh -batch -pw $env:DEPLOY_PASSWORD "root@$env:DEPLOY_SERVER" $finalCheckCmd

Write-Host ""
Write-Host "🌐 Проверка доступности сайта..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Сайт доступен (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Не удалось проверить сайт: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 ВСЕ ГОТОВО!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

