# Deploy script using PuTTY plink
param(
    [string]$Server = "REDACTED_IP",
    [string]$User = "root", 
    [string]$Password = "REDACTED_PASSWORD"
)

Write-Host "🚀 Deploying via PuTTY plink..." -ForegroundColor Green
Write-Host "Server: $Server" -ForegroundColor Yellow
Write-Host "User: $User" -ForegroundColor Yellow

# Deploy commands
$deployCommands = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

try {
    # Check if plink exists
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    
    if ($plinkPath) {
        Write-Host "✅ Found plink at: $($plinkPath.Source)" -ForegroundColor Green
        Write-Host "🔐 Connecting to server..." -ForegroundColor Yellow
        
        # Execute commands via plink
        $result = & plink -ssh -batch -pw $Password $User@$Server $deployCommands
        
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
        Write-Host "ssh $User@$Server" -ForegroundColor White
        Write-Host "Password: $Password" -ForegroundColor Gray
        Write-Host "`nThen run:" -ForegroundColor Yellow
        Write-Host $deployCommands -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔧 Manual deployment:" -ForegroundColor Cyan
    Write-Host "ssh $User@$Server" -ForegroundColor White
    Write-Host "Password: $Password" -ForegroundColor Gray
    Write-Host "`nCommands to run:" -ForegroundColor Yellow
    Write-Host $deployCommands -ForegroundColor White
}

Write-Host "`n🌐 After deployment, check: http://$Server" -ForegroundColor Green
Write-Host "🎯 Expected result: Dynamic page titles working" -ForegroundColor Cyan
