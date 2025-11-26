# Скрипт деплоя на продакшен сервер Orange Curium
Write-Host "🚀 Начинаем деплой на продакшен..." -ForegroundColor Green

$SERVER = "83.166.244.71"
$USER = "root"
$PASSWORD = "yqOdhMhP41s5827h"
$DEPLOY_COMMAND = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

Write-Host "📡 Подключаемся к серверу $SERVER..." -ForegroundColor Yellow

# Используем plink для подключения
$plinkPath = Join-Path $PSScriptRoot "plink.exe"

if (Test-Path $plinkPath) {
    Write-Host "✅ Найден plink.exe" -ForegroundColor Green
    
    # Создаём временный файл с командой
    $tempScript = Join-Path $env:TEMP "deploy_script.sh"
    $DEPLOY_COMMAND | Out-File -FilePath $tempScript -Encoding UTF8
    
    # Выполняем команду через plink
    Write-Host "🔧 Выполняем деплой..." -ForegroundColor Yellow
    
    $plinkCommand = "-ssh $USER@$SERVER -pw $PASSWORD -m `"$tempScript`""
    
    & $plinkPath $plinkCommand.Split(' ')
    
    # Удаляем временный файл
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    
} else {
    Write-Host "⚠️  plink.exe не найден, используем прямое подключение через SSH" -ForegroundColor Yellow
    
    # Пробуем использовать ssh напрямую (если установлен OpenSSH)
    try {
        $sshCommand = "ssh -o StrictHostKeyChecking=no $USER@$SERVER `"$DEPLOY_COMMAND`""
        Write-Host "Выполняем: $sshCommand" -ForegroundColor Cyan
        Invoke-Expression $sshCommand
    } catch {
        Write-Host "❌ Ошибка подключения. Выполните команду вручную:" -ForegroundColor Red
        Write-Host "ssh $USER@$SERVER" -ForegroundColor Cyan
        Write-Host "Затем выполните:" -ForegroundColor Yellow
        Write-Host $DEPLOY_COMMAND -ForegroundColor Cyan
    }
}

Write-Host "`n✅ Деплой завершён!" -ForegroundColor Green
Write-Host "🌐 Проверьте сайт: http://$SERVER:3000" -ForegroundColor Cyan

