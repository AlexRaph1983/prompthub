$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$script = 'cd /root/prompthub && pm2 logs prompthub --lines 30 --nostream && pm2 stop prompthub && API_KEY=$(openssl rand -base64 32) && cat > ecosystem.config.js << EOF
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
      NEXTAUTH_SECRET: "$API_KEY"
    },
    autorestart: true,
    max_restarts: 3
  }]
}
EOF
pm2 start ecosystem.config.js && pm2 save && sleep 30 && netstat -tlnp | grep :3000 && curl -I http://localhost:3000 && echo "FINAL_KEY:$API_KEY"'

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
    
    Write-Host "FINAL DEBUG AND FIX..." -ForegroundColor Red
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $script
    Write-Host $result -ForegroundColor White
    
    if ($result -match "FINAL_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "API key updated" -ForegroundColor Green
    }
    
    Write-Host "CHECKING SITE..." -ForegroundColor Yellow
    
    for ($test = 1; $test -le 20; $test++) {
        Start-Sleep 25
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
            Write-Host "SITE IS WORKING! Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "URL: https://prompt-hub.site" -ForegroundColor White
            break
        } catch {
            Write-Host "Test ${test}: Waiting..." -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Failed" -ForegroundColor Red
}
