$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$fixScript = @'
cd /root/prompthub
pm2 kill
systemctl restart nginx
git reset --hard origin/main
API_KEY=$(openssl rand -base64 32)
export ADMIN_API_KEY=$API_KEY
export NEXTAUTH_SECRET=$API_KEY
rm -rf node_modules .next
npm install
npm run build
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'prompthub',
    script: 'npm',
    args: 'start',
    cwd: '/root/prompthub',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      ADMIN_API_KEY: '$API_KEY',
      NEXTAUTH_SECRET: '$API_KEY'
    },
    autorestart: true
  }]
}
EOF
pm2 start ecosystem.config.js
pm2 save
sleep 8
curl -I http://localhost:3000
echo "RESULT:$API_KEY"
'@

try {
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        $plink = "$env:TEMP\plink.exe"
        Invoke-WebRequest "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink -UseBasicParsing
        $plinkCmd = $plink
    } else {
        $plinkCmd = "plink"
    }
    
    Write-Host "Executing full restoration..." -ForegroundColor Yellow
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fixScript
    
    Write-Host $result -ForegroundColor White
    
    if ($result -match "RESULT:(.+)") {
        $apiKey = $matches[1].Trim()
        @"
API_BASE_URL=https://prompt-hub.site
API_KEY=$apiKey
"@ | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "Config updated with API key" -ForegroundColor Green
    }
    
    Start-Sleep 5
    
    try {
        $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 15
        Write-Host "✅ SITE FULLY RESTORED - HTTP $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Site is now accessible at: https://prompt-hub.site" -ForegroundColor White
    } catch {
        Write-Host "⚠️ Site may still be starting up..." -ForegroundColor Yellow
        Start-Sleep 10
        try {
            $response2 = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ SITE NOW WORKING - HTTP $($response2.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "❌ Site still not responding" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Restoration failed: $($_.Exception.Message)" -ForegroundColor Red
}
