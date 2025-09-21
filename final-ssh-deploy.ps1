# Final SSH Deployment Script
$server = $env:DEPLOY_SERVER_IP
$username = $env:DEPLOY_SSH_USER
$password = $env:DEPLOY_SSH_PASS

Write-Host "🚀 Executing deployment on $server..." -ForegroundColor Green

$deployCommands = @"
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
echo 'Deployment completed successfully!'
"@

Write-Host "📋 Commands to execute:" -ForegroundColor Yellow
Write-Host $deployCommands -ForegroundColor Gray

# Попытка автоматического выполнения через plink
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "✅ Using plink for automated deployment..." -ForegroundColor Green
    try {
        $result = & plink -ssh -batch -pw $password $username@$server $deployCommands.Replace("`n", " && ")
        Write-Host "📤 Deployment result:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
        Write-Host "✅ Deployment executed!" -ForegroundColor Green
    } catch {
        Write-Host "❌ plink failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ plink not found. Manual deployment required." -ForegroundColor Yellow
}

Write-Host "`n🔧 Manual deployment option:" -ForegroundColor Cyan
Write-Host "ssh $username@$server" -ForegroundColor White  
Write-Host "`nThen execute the commands above." -ForegroundColor Yellow

Write-Host "`n🌐 After deployment, check: http://$server" -ForegroundColor Green
