$Server = 'YOUR_SERVER_IP_HERE'
$User = 'root'
$Password = 'YOUR_PASSWORD_HERE'

$script = 'cd /root/prompthub && pm2 delete all && API_KEY=$(openssl rand -base64 32) && NEXT_SECRET=$(openssl rand -base64 32) && cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "prompthub",
    script: "npm",
    args: "start",
    cwd: "/root/prompthub",
    env: {
      NODE_ENV: "production",
      PORT: "3000",
      ADMIN_API_KEY: "$API_KEY",
      NEXTAUTH_SECRET: "$NEXT_SECRET"
    },
    autorestart: true,
    max_restarts: 3
  }]
}
EOF
pm2 start ecosystem.config.js && pm2 save && sleep 40 && netstat -tlnp | grep :3000 && curl -sI http://localhost:3000 && echo "FINAL_SUCCESS_KEY:$API_KEY"'

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
    
    Write-Host "FINAL CLEAN FIX..." -ForegroundColor Magenta
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $script
    Write-Host $result -ForegroundColor White
    
    if ($result -match "FINAL_SUCCESS_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "API key saved" -ForegroundColor Green
    }
    
    Write-Host "CHECKING FINAL RESULT..." -ForegroundColor Cyan
    
    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep 30
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
            Write-Host "SITE IS WORKING! Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "URL: https://prompt-hub.site" -ForegroundColor White
            break
        } catch {
            Write-Host "Check $i waiting..." -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Failed" -ForegroundColor Red
}
