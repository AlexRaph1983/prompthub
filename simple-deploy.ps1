# Simple SSH Deployment Script
$SERVER_IP = "83.166.244.71"
$USERNAME = "root"
$PASSWORD = "yqOdhMhP41s5827h"

Write-Host "🚀 Starting deployment to $SERVER_IP..." -ForegroundColor Green

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

Write-Host "📋 Commands to execute:" -ForegroundColor Yellow
Write-Host $commands -ForegroundColor Gray

Write-Host "`n🔐 Connect manually with:" -ForegroundColor Cyan
Write-Host "ssh $USERNAME@$SERVER_IP" -ForegroundColor White
Write-Host "Password: $PASSWORD" -ForegroundColor Gray

Write-Host "`n🌐 After deployment check: http://$SERVER_IP" -ForegroundColor Green
