$Server = 'REDACTED_IP'
$User = 'root'
$Password = 'REDACTED_PASSWORD'

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
      NEXTAUTH_SECRET: "$NEXT_SECRET",
      IMPERSONATION_SECRET: "$NEXT_SECRET"
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: "10s"
  }]
}
EOF
pm2 start ecosystem.config.js && pm2 save && sleep 40 && pm2 logs prompthub --lines 5 --nostream && netstat -tlnp | grep :3000 && curl -sI http://localhost:3000 && echo "SUCCESS_API_KEY:$API_KEY"'

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
    
    Write-Host "ULTIMATE FINAL FIX..." -ForegroundColor Magenta
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $script
    Write-Host $result -ForegroundColor White
    
    if ($result -match "SUCCESS_API_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "✅ Final API key configured" -ForegroundColor Green
    }
    
    Write-Host "`n🔍 FINAL SITE VERIFICATION..." -ForegroundColor Cyan
    
    $siteWorking = $false
    for ($final = 1; $final -le 25; $final++) {
        Start-Sleep 30
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
            Write-Host "🎉 SITE FULLY RESTORED AND WORKING!" -ForegroundColor Green
            Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔧 Bulk uploader ready: D:\BulkPromptUploader" -ForegroundColor White
            $siteWorking = $true
            break
        } catch {
            Write-Host "Final verification ${final}/25: Site starting..." -ForegroundColor Yellow
        }
    }
    
    if (-not $siteWorking) {
        Write-Host "❌ Site still not responding after all attempts" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Ultimate fix failed" -ForegroundColor Red
}
