# PowerShell скрипт для деплоя на сервер
Write-Host "Starting deployment of multilingual categories..." -ForegroundColor Green

# Создаем команды для выполнения на сервере
$commands = "cd ~/prompthub && echo 'Updating code...' && git pull origin main && echo 'Installing dependencies...' && npm install && echo 'Building application...' && npm run build && echo 'Restarting application...' && pm2 restart prompthub && echo 'Deployment completed!' && pm2 status"

# Выполняем команды на сервере
try {
    Write-Host "Connecting to server..." -ForegroundColor Yellow
    $result = ssh root@83.166.244.71 -o StrictHostKeyChecking=no $commands
    Write-Host "Commands executed successfully!" -ForegroundColor Green
    Write-Host $result
} catch {
    Write-Host "Error executing commands: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try executing commands manually:" -ForegroundColor Yellow
    Write-Host "ssh root@83.166.244.71" -ForegroundColor Cyan
    Write-Host "cd ~/prompthub" -ForegroundColor Cyan
    Write-Host "git pull origin main" -ForegroundColor Cyan
    Write-Host "pm2 restart prompthub" -ForegroundColor Cyan
}

Write-Host "Deployment completed! Check https://prompt-hub.site" -ForegroundColor Green
