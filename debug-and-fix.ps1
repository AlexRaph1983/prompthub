$Server = 'REDACTED_IP'
$User = 'root'
$Password = 'REDACTED_PASSWORD'

$debugScript = 'cd /root/prompthub && echo "=== DEBUG INFO ===" && pm2 logs prompthub --lines 30 --nostream && echo "=== PM2 STATUS ===" && pm2 describe prompthub && echo "=== FIXING ===" && pm2 stop prompthub && cd /root/prompthub && API_KEY=$(openssl rand -base64 32) && cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "prompthub",
    script: "./node_modules/.bin/next",
    args: "start -p 3000",
    cwd: "/root/prompthub",
    env: {
      NODE_ENV: "production",
      PORT: "3000",
      ADMIN_API_KEY: "$API_KEY",
      NEXTAUTH_SECRET: "$API_KEY",
      IMPERSONATION_SECRET: "$API_KEY"
    },
    autorestart: true,
    max_restarts: 5,
    min_uptime: "10s"
  }]
}
EOF
pm2 start ecosystem.config.js && pm2 save && sleep 30 && pm2 logs prompthub --lines 10 --nostream && netstat -tlnp | grep :3000 && curl -I http://localhost:3000 && echo "WORKING_KEY:$API_KEY"'

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
    
    Write-Host "DEBUGGING AND FIXING PM2..." -ForegroundColor Red
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $debugScript
    Write-Host $result -ForegroundColor White
    
    if ($result -match "WORKING_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "✅ New API key saved" -ForegroundColor Green
    }
    
    Write-Host "`nFINAL VERIFICATION..." -ForegroundColor Cyan
    
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep 20
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
            Write-Host "🎉 SITE FINALLY WORKING! Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 https://prompt-hub.site" -ForegroundColor White
            break
        } catch {
            Write-Host "Final test $i: Still checking..." -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Debug failed" -ForegroundColor Red
}
