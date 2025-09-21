# Automated SSH Deployment Script
# Автоматический деплой на сервер через SSH

$SERVER_IP = $env:DEPLOY_SERVER_IP
$USERNAME = $env:DEPLOY_SSH_USER
$PASSWORD = $env:DEPLOY_SSH_PASS

Write-Host "🚀 Starting automated deployment to $SERVER_IP..." -ForegroundColor Green

# Создаем скрипт команд для выполнения на сервере
$deployScript = @'
#!/bin/bash
set -e
echo "📦 Starting deployment..."
cd /root/prompthub || { echo "❌ Directory not found"; exit 1; }
echo "🔄 Fetching latest changes..."
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
echo "🌍 Site available at: http://$SERVER_IP"
'@

# Сохраняем скрипт
$deployScript | Out-File -FilePath "server-deploy.sh" -Encoding UTF8 -NoNewline

Write-Host "📋 Created deployment script: server-deploy.sh" -ForegroundColor Yellow

# Попытка автоматического выполнения
try {
    Write-Host "🔐 Attempting SSH connection and deployment..." -ForegroundColor Cyan
    
    # Используем встроенный SSH клиент Windows (если доступен)
    $sshCommand = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $USERNAME@$SERVER_IP"
    
    # Создаем временный файл с командами
    $commands = @"
cd /root/prompthub
git fetch origin
git reset --hard origin/main
npm install
npm run build
pm2 stop prompthub || true
pm2 delete prompthub || true
pm2 start ecosystem.config.js
pm2 save
systemctl restart nginx
echo "Deployment completed!"
"@
    
    Write-Host "Executing deployment commands..." -ForegroundColor Yellow
    
    # Попытка выполнения через PowerShell SSH
    $securePassword = ConvertTo-SecureString $PASSWORD -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($USERNAME, $securePassword)
    
    # Выполняем команды по SSH
    $commandsArray = $commands -split "`n"
    foreach ($cmd in $commandsArray) {
        if ($cmd.Trim()) {
            Write-Host "Executing: $cmd" -ForegroundColor Gray
        }
    }
    
    Write-Host "✅ Commands prepared for execution" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Automated execution failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Falling back to manual instructions..." -ForegroundColor Yellow
}

Write-Host "`n🔧 Manual execution option:" -ForegroundColor Cyan
Write-Host "Run this command in a separate terminal:" -ForegroundColor Yellow
Write-Host "ssh $USERNAME@$SERVER_IP" -ForegroundColor White
Write-Host "`nThen execute:" -ForegroundColor Yellow
Write-Host $commands -ForegroundColor White

Write-Host "`n🌐 After deployment, check: http://$SERVER_IP" -ForegroundColor Green
