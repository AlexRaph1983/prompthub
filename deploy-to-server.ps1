# Скрипт деплоя на сервер
Write-Host "🚀 Начинаем деплой на сервер..." -ForegroundColor Green

# Команда для выполнения на сервере согласно правилам workspace
$deployCommand = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

Write-Host "📋 Команда для выполнения на сервере:" -ForegroundColor Yellow
Write-Host $deployCommand -ForegroundColor Cyan

Write-Host "`n🔧 Выполните эту команду на сервере:" -ForegroundColor Green
Write-Host "1. Подключитесь к серверу по SSH" -ForegroundColor White
Write-Host "2. Выполните команду:" -ForegroundColor White
Write-Host "   $deployCommand" -ForegroundColor Cyan

Write-Host "`n📝 Альтернативно, если у вас есть SSH доступ из PowerShell:" -ForegroundColor Yellow
Write-Host "ssh user@server '$deployCommand'" -ForegroundColor Cyan

Write-Host "`n✅ После выполнения команды новые промпты будут доступны на продакшн сайте!" -ForegroundColor Green