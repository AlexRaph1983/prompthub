$Server = 'REDACTED_IP'
$User = 'root'
$Password = 'REDACTED_PASSWORD'

try {
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        $plink = "$env:TEMP\plink.exe"
        if (-not (Test-Path $plink)) {
            Write-Host "Downloading plink..." -ForegroundColor Yellow
            Invoke-WebRequest "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink -UseBasicParsing
        }
        $plinkCmd = $plink
    } else {
        $plinkCmd = "plink"
    }
    
    Write-Host "=== DIRECT DEPLOYMENT FROM LOCAL REPO ===" -ForegroundColor Green
    
    # Deploy using the standard deploy script approach
    Write-Host "Executing deployment..." -ForegroundColor Yellow
    $deployResult = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 stop all && pm2 start npm --name prompthub -- start && pm2 save && sleep 20 && pm2 list && netstat -tlnp | grep :3000'
    Write-Host $deployResult -ForegroundColor White
    
    Write-Host "`n=== TESTING DEPLOYED SITE ===" -ForegroundColor Cyan
    
    # Test the deployed site
    $maxTests = 15
    $siteWorking = $false
    
    for ($test = 1; $test -le $maxTests; $test++) {
        Write-Host "Testing deployment - attempt $test/$maxTests..." -ForegroundColor Yellow
        Start-Sleep 15
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 25
            Write-Host "🎉 SITE SUCCESSFULLY DEPLOYED!" -ForegroundColor Green
            Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔄 Deployed from origin/main branch" -ForegroundColor White
            $siteWorking = $true
            break
        } catch {
            Write-Host "❌ Test $test failed: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Red
        }
    }
    
    if (-not $siteWorking) {
        Write-Host "`n⚠️ Site not responding. Final diagnostic..." -ForegroundColor Yellow
        
        # Check if server is running locally
        try {
            $directTest = Invoke-WebRequest "http://REDACTED_IP:3000" -UseBasicParsing -TimeoutSec 15
            Write-Host "✅ Direct server access works: $($directTest.StatusCode)" -ForegroundColor Green
            Write-Host "❌ Issue is with domain/nginx proxy" -ForegroundColor Red
        } catch {
            Write-Host "❌ Server not responding on port 3000" -ForegroundColor Red
            
            # Get detailed diagnostic
            Write-Host "Getting detailed diagnostic..." -ForegroundColor Yellow
            $diagnostic = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && echo "=== PM2 LOGS ===" && pm2 logs prompthub --lines 15 --nostream && echo "=== PM2 STATUS ===" && pm2 describe prompthub && echo "=== PORT STATUS ===" && netstat -tlnp | grep :3000 && echo "=== NGINX STATUS ===" && systemctl status nginx --no-pager'
            Write-Host $diagnostic -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ DEPLOYMENT FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
