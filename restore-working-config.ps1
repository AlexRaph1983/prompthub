$Server = 'REDACTED_IP'
$User = 'root'
$Password = 'REDACTED_PASSWORD'

$restoreScript = @'
#!/bin/bash
set -e

cd /root/prompthub
echo "=== RESTORING LAST WORKING CONFIGURATION ==="

# Stop current broken processes
pm2 kill || true

# Check git log to find stable commit from ~2 hours ago
echo "Git history:"
git log --oneline -10

# Reset to a stable commit (before our admin API changes that broke things)
echo "Resetting to stable version..."
git reset --hard HEAD~5  # Go back 5 commits to before our changes

# Clean rebuild
echo "Clean rebuild..."
rm -rf node_modules .next
npm install
npm run build

# Create simple working PM2 config (like it was working before)
echo "Creating working PM2 config..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'prompthub',
    script: 'npm',
    args: 'start',
    cwd: '/root/prompthub',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# Start with working config
echo "Starting with working configuration..."
pm2 start ecosystem.config.js
pm2 save

# Wait and test
sleep 30
echo "Testing localhost..."
curl -I http://localhost:3000

echo "=== RESTORATION COMPLETE ==="
echo "PM2 Status:"
pm2 list

echo "Port status:"
netstat -tlnp | grep :3000
'@

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
    
    Write-Host "=== RESTORING LAST WORKING CONFIGURATION ===" -ForegroundColor Green
    Write-Host "Rolling back to stable version from ~2 hours ago..." -ForegroundColor Yellow
    
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $restoreScript
    Write-Host $result -ForegroundColor White
    
    Write-Host "`n=== TESTING RESTORED SITE ===" -ForegroundColor Cyan
    
    # Test the restored site
    $maxAttempts = 15
    $siteRestored = $false
    
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        Write-Host "Testing restored site - attempt $attempt/$maxAttempts..." -ForegroundColor Yellow
        Start-Sleep 10
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 20
            Write-Host "🎉 SITE SUCCESSFULLY RESTORED!" -ForegroundColor Green
            Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔄 Configuration restored to working state from 2 hours ago" -ForegroundColor White
            $siteRestored = $true
            break
        } catch {
            Write-Host "❌ Attempt $attempt failed: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Red
        }
    }
    
    if (-not $siteRestored) {
        Write-Host "`n⚠️ Site not responding after restoration. Checking server directly..." -ForegroundColor Yellow
        try {
            $directTest = Invoke-WebRequest "http://REDACTED_IP:3000" -UseBasicParsing -TimeoutSec 15
            Write-Host "✅ Direct server access works: $($directTest.StatusCode)" -ForegroundColor Green
            Write-Host "❌ Issue may be with domain/nginx configuration" -ForegroundColor Red
        } catch {
            Write-Host "❌ Server still not responding on port 3000" -ForegroundColor Red
            
            # Get diagnostic info
            Write-Host "`nGetting diagnostic information..." -ForegroundColor Yellow
            $diagnostic = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && pm2 logs prompthub --lines 20 --nostream && pm2 describe prompthub'
            Write-Host $diagnostic -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ RESTORATION FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
