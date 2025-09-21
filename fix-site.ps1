$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$fixScript = 'cd /root/prompthub && echo "Emergency fix starting..." && pm2 kill && systemctl restart nginx && rm -rf node_modules .next && npm install --production && npm run build && API_KEY=$(openssl rand -base64 32) && export ADMIN_API_KEY=$API_KEY && export NEXTAUTH_SECRET=$API_KEY && export NODE_ENV=production && export PORT=3000 && pm2 start npm --name prompthub -- start && pm2 save && sleep 15 && pm2 list && netstat -tlnp | grep :3000 && curl -I http://localhost:3000 && echo "FINAL_API_KEY:$API_KEY"'

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
    
    Write-Host "EMERGENCY RESTORATION STARTING..." -ForegroundColor Red
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fixScript
    Write-Host $result -ForegroundColor White
    
    if ($result -match "FINAL_API_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "API key saved" -ForegroundColor Green
    }
    
    Write-Host "TESTING SITE..." -ForegroundColor Yellow
    
    $success = $false
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep 8
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 20
            Write-Host "SUCCESS! Site working - Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "Site URL: https://prompt-hub.site" -ForegroundColor White
            $success = $true
            break
        } catch {
            Write-Host "Test $i failed, retrying..." -ForegroundColor Yellow
        }
    }
    
    if (-not $success) {
        Write-Host "Testing direct access..." -ForegroundColor Yellow
        try {
            $direct = Invoke-WebRequest "http://83.166.244.71:3000" -UseBasicParsing -TimeoutSec 10
            Write-Host "Direct access works: $($direct.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "Direct access failed" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}