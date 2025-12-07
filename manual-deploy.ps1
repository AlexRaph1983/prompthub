# Manual SSH Deployment Script
# Подключение к серверу и выполнение команд деплоя

$SERVER_IP = "YOUR_SERVER_IP_HERE"
$PASSWORD = "YOUR_PASSWORD_HERE"

Write-Host "🔑 Connecting to server and deploying..." -ForegroundColor Green

# Создаем временный скрипт для автоматизации SSH
$sshScript = @"
#!/bin/bash
cd /root/prompthub
echo "📦 Fetching latest changes..."
git fetch origin
git reset --hard origin/main
echo "📋 Installing dependencies..."
npm install
echo "🏗️ Building application..."
npm run build
echo "🔄 Restarting PM2..."
pm2 stop prompthub || true
pm2 delete prompthub || true
pm2 start ecosystem.config.js
pm2 save
echo "🌐 Restarting Nginx..."
systemctl restart nginx
echo "✅ Deployment completed successfully!"
echo "🌍 Site should be available at: http://YOUR_SERVER_IP_HERE"
"@

# Сохраняем скрипт во временный файл
$tempScript = "temp-deploy.sh"
$sshScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📋 Deployment script created: $tempScript" -ForegroundColor Yellow
Write-Host "🔧 To deploy manually, run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "scp $tempScript root@${SERVER_IP}:/tmp/" -ForegroundColor Gray
Write-Host "ssh root@$SERVER_IP 'chmod +x /tmp/$tempScript && /tmp/$tempScript'" -ForegroundColor Gray
Write-Host ""
Write-Host "Or connect directly and run:" -ForegroundColor Cyan
Write-Host "ssh root@$SERVER_IP" -ForegroundColor Gray
Write-Host "Password: $PASSWORD" -ForegroundColor Gray

# Попытка автоматического выполнения через PowerShell SSH
try {
    Write-Host "🚀 Attempting automatic deployment..." -ForegroundColor Yellow
    
    # Используем PowerShell для подключения
    $securePassword = ConvertTo-SecureString $PASSWORD -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential ("root", $securePassword)
    
    # Выполняем команды через Invoke-Command (если доступно)
    $deployCommands = @(
        "cd /root/prompthub",
        "git fetch origin",
        "git reset --hard origin/main", 
        "npm install",
        "npm run build",
        "pm2 stop prompthub || true",
        "pm2 delete prompthub || true", 
        "pm2 start ecosystem.config.js",
        "pm2 save",
        "systemctl restart nginx",
        "echo 'Deployment completed!'"
    )
    
    Write-Host "Commands to execute:" -ForegroundColor Gray
    $deployCommands | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    
} catch {
    Write-Host "❌ Automatic deployment not available: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 After deployment, check: http://YOUR_SERVER_IP_HERE" -ForegroundColor Green
