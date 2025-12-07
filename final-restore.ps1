$Server = 'YOUR_SERVER_IP_HERE'
$User = 'root'
$Password = 'YOUR_PASSWORD_HERE'

$script = 'cd /root/prompthub && pm2 kill && systemctl restart nginx && rm -rf node_modules .next && npm install && npm run build && API_KEY=$(openssl rand -base64 32) && export ADMIN_API_KEY=$API_KEY && export NEXTAUTH_SECRET=$API_KEY && export NODE_ENV=production && pm2 start npm --name prompthub -- start && pm2 save && sleep 20 && pm2 list && netstat -tlnp | grep :3000 && curl -sI http://localhost:3000 && echo "RESTORE_KEY:$API_KEY"'

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
    
    Write-Host "FINAL RESTORATION STARTING..." -ForegroundColor Cyan
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $script
    Write-Host $result -ForegroundColor White
    
    if ($result -match "RESTORE_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "API key saved" -ForegroundColor Green
    }
    
    Write-Host "TESTING SITE RESTORATION..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep 12
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
            Write-Host "SUCCESS! Site restored - Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "Site URL: https://prompt-hub.site" -ForegroundColor White
            break
        } catch {
            Write-Host "Test $i failed, continuing..." -ForegroundColor Yellow
            if ($i -eq 15) {
                Write-Host "Final test - checking server directly..." -ForegroundColor Yellow
                try {
                    $direct = Invoke-WebRequest "http://YOUR_SERVER_IP_HERE:3000" -UseBasicParsing -TimeoutSec 15
                    Write-Host "Direct server works: $($direct.StatusCode)" -ForegroundColor Green
                } catch {
                    Write-Host "Server not responding" -ForegroundColor Red
                }
            }
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
