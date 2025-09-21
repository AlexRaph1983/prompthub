# PuTTY plink deployment script
# Использует plink для автоматического SSH подключения

$SERVER_IP = $env:DEPLOY_SERVER_IP
$USERNAME = $env:DEPLOY_SSH_USER
$PASSWORD = $env:DEPLOY_SSH_PASS # optional; prefer key auth

Write-Host "🚀 Deploying via PuTTY plink..." -ForegroundColor Green

# Команды для выполнения на сервере
$deployCommands = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh && echo 'Deployment completed successfully!'"

try {
    # Проверяем наличие plink
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    
    if ($plinkPath) {
        Write-Host "✅ Found plink at: $($plinkPath.Source)" -ForegroundColor Green
        Write-Host "🔐 Connecting to server..." -ForegroundColor Yellow
        
        # Выполняем команды через plink
        $result = & plink -ssh -batch -pw $PASSWORD $USERNAME@$SERVER_IP $deployCommands
        
        Write-Host "📤 Deployment output:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment successful!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Deployment completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ plink not found. Please install PuTTY or use manual method." -ForegroundColor Red
        Write-Host "Download PuTTY from: https://www.putty.org/" -ForegroundColor Yellow
        
        Write-Host "`n🔧 Manual alternative:" -ForegroundColor Cyan
        Write-Host "ssh $USERNAME@$SERVER_IP" -ForegroundColor White
        Write-Host "Password: $PASSWORD" -ForegroundColor Gray
        Write-Host "`nThen run:" -ForegroundColor Yellow
        Write-Host $deployCommands -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔧 Manual deployment:" -ForegroundColor Cyan
    Write-Host "ssh $USERNAME@$SERVER_IP" -ForegroundColor White
    Write-Host "Password: $PASSWORD" -ForegroundColor Gray
    Write-Host "`nCommands to run:" -ForegroundColor Yellow
    Write-Host $deployCommands -ForegroundColor White
}

Write-Host "`n🌐 After deployment, check: http://$SERVER_IP" -ForegroundColor Green
Write-Host "🎯 Expected result: Fully working site with 18 prompts restored" -ForegroundColor Cyan
