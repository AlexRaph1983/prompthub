# Скрипт для деплоя фавиконки на сервер
Write-Host "🚀 Деплой фавиконки на сервер Orange Curium..." -ForegroundColor Green

# Параметры сервера
$server = "83.166.244.71"
$user = "root"
$password = "yqOdhMhP41s5827h"

# Команда для выполнения на сервере
$deployCommand = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

Write-Host "📋 Выполняем деплой на сервер $server..." -ForegroundColor Yellow

try {
    # Используем plink для SSH подключения
    $plinkPath = ".\plink.exe"
    if (Test-Path $plinkPath) {
        Write-Host "✅ Найден plink.exe, выполняем деплой..." -ForegroundColor Green
        echo $password | & $plinkPath -ssh $user@$server $deployCommand
    } else {
        Write-Host "❌ plink.exe не найден. Попробуем использовать встроенный SSH..." -ForegroundColor Red
        # Альтернативный способ через PowerShell SSH
        $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($user, $securePassword)
        
        # Выполняем команду через SSH
        Write-Host "🔧 Выполняем деплой через SSH..." -ForegroundColor Yellow
        $session = New-PSSession -ComputerName $server -Credential $credential
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            git fetch origin
            git reset --hard origin/main
            bash scripts/deploy.sh
        }
        Remove-PSSession $session
    }
    
    Write-Host "✅ Деплой завершен успешно!" -ForegroundColor Green
    Write-Host "🌐 Сайт доступен по адресу: https://prompt-hub.site" -ForegroundColor Cyan
    Write-Host "📱 Новая фавиконка 120x120 добавлена!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Ошибка при деплое: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📝 Ручной деплой:" -ForegroundColor Yellow
    Write-Host "1. Подключитесь к серверу: ssh $user@$server" -ForegroundColor White
    Write-Host "2. Выполните команду: $deployCommand" -ForegroundColor White
}
