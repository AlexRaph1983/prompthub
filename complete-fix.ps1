$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$fullFixScript = 'cd /root/prompthub && echo "=== COMPLETE FIX STARTING ===" && pm2 kill && systemctl restart nginx && rm -rf node_modules .next && npm install && npm run build && API_KEY=$(openssl rand -base64 32) && export ADMIN_API_KEY=$API_KEY && export NEXTAUTH_SECRET=$API_KEY && export NODE_ENV=production && export PORT=3000 && pm2 start npm --name prompthub -- start && pm2 save && sleep 20 && pm2 list && netstat -tlnp | grep :3000 && curl -sI http://localhost:3000 && echo "SUCCESS_KEY:$API_KEY"'

try {
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        $plink = "$env:TEMP\plink.exe"
        if (-not (Test-Path $plink)) {
            Invoke-WebRequest "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink -UseBasicParsing
        }
        $plinkCmd = $plink
    } else {
        $plinkCmd = "plink"
    }
    
    Write-Host "=== COMPLETE SITE RESTORATION ===" -ForegroundColor Cyan
    Write-Host "Installing full dependencies and building..." -ForegroundColor Yellow
    
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fullFixScript
    Write-Host $result -ForegroundColor White
    
    # Save API key
    if ($result -match "SUCCESS_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "✅ API key configured: $($apiKey.Substring(0,12))..." -ForegroundColor Green
    }
    
    Write-Host "`n=== FINAL SITE VERIFICATION ===" -ForegroundColor Cyan
    
    $maxTests = 12
    $testInterval = 10
    $siteWorking = $false
    
    for ($test = 1; $test -le $maxTests; $test++) {
        Write-Host "Site test $test/$maxTests..." -ForegroundColor Yellow
        Start-Sleep $testInterval
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 25
            Write-Host "🎉 SITE FULLY RESTORED! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔧 Bulk uploader ready: D:\BulkPromptUploader" -ForegroundColor White
            $siteWorking = $true
            break
        } catch {
            Write-Host "❌ Test $test failed: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Red
        }
    }
    
    if (-not $siteWorking) {
        Write-Host "`n⚠️ FINAL DIAGNOSTIC CHECK..." -ForegroundColor Yellow
        
        # Test direct server access
        try {
            $directTest = Invoke-WebRequest "http://83.166.244.71:3000" -UseBasicParsing -TimeoutSec 15
            Write-Host "✅ Direct server access OK: $($directTest.StatusCode)" -ForegroundColor Green
            Write-Host "❌ Issue is with domain/nginx proxy configuration" -ForegroundColor Red
        } catch {
            Write-Host "❌ Server not responding on port 3000" -ForegroundColor Red
            
            # Get final logs
            Write-Host "Getting final diagnostic info..." -ForegroundColor Yellow
            $finalDiag = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && echo "PM2 Status:" && pm2 list && echo "Port Status:" && netstat -tlnp | grep :3000 && echo "PM2 Logs:" && pm2 logs prompthub --lines 15 --nostream'
            Write-Host $finalDiag -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ CRITICAL FAILURE: $($_.Exception.Message)" -ForegroundColor Red
}