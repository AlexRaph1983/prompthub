$Server = 'YOUR_SERVER_IP_HERE'
$User = 'root'
$Password = 'YOUR_PASSWORD_HERE'

$diagnosticScript = @'
#!/bin/bash
set -e

echo "=== COMPREHENSIVE SITE DIAGNOSIS ==="
cd /root/prompthub

echo "1. CHECKING PM2 STATUS:"
pm2 list || echo "PM2 not responding"
pm2 logs prompthub --lines 20 --nostream || echo "No PM2 logs"

echo -e "\n2. CHECKING PORT 3000:"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
lsof -i :3000 || echo "No process on port 3000"

echo -e "\n3. CHECKING NGINX STATUS:"
systemctl status nginx --no-pager || echo "Nginx issues"
nginx -t || echo "Nginx config errors"

echo -e "\n4. CHECKING APPLICATION FILES:"
ls -la .next/BUILD_ID 2>/dev/null || echo "No build found"
ls -la node_modules/next/dist/bin/next 2>/dev/null || echo "Next.js missing"

echo -e "\n5. TESTING LOCALHOST:"
curl -I http://localhost:3000 2>/dev/null || echo "Localhost not responding"

echo -e "\n6. CHECKING ENVIRONMENT:"
echo "NODE_ENV: ${NODE_ENV:-not_set}"
echo "PORT: ${PORT:-not_set}"
echo "ADMIN_API_KEY: ${ADMIN_API_KEY:+SET}"

echo -e "\n=== STARTING COMPREHENSIVE FIX ==="

# Kill everything
echo "7. STOPPING ALL SERVICES:"
pm2 kill || true
pkill -f "next" || true
pkill -f "npm" || true

# Restart nginx
echo "8. RESTARTING NGINX:"
systemctl restart nginx

# Clean environment
echo "9. CLEANING BUILD:"
rm -rf .next node_modules/.cache

# Ensure dependencies
echo "10. CHECKING DEPENDENCIES:"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production --no-audit --no-fund
fi

# Build if needed
echo "11. BUILDING APPLICATION:"
if [ ! -f ".next/BUILD_ID" ]; then
    echo "Building from scratch..."
    npm run build || {
        echo "Build failed, trying alternative..."
        rm -rf .next
        NODE_ENV=production npm run build
    }
fi

# Generate new API key
echo "12. SETTING UP ENVIRONMENT:"
API_KEY=$(openssl rand -base64 32 | tr -d '\n')
NEXT_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# Create production ecosystem config
echo "13. CREATING PM2 CONFIG:"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'prompthub',
    script: './node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/root/prompthub',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      ADMIN_API_KEY: '$API_KEY',
      NEXTAUTH_SECRET: '$NEXT_SECRET',
      IMPERSONATION_SECRET: '$NEXT_SECRET'
    },
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/prompthub-error.log',
    out_file: '/root/.pm2/logs/prompthub-out.log',
    log_file: '/root/.pm2/logs/prompthub-combined.log'
  }]
};
EOF

# Start PM2
echo "14. STARTING PM2:"
pm2 start ecosystem.config.js
pm2 save

# Wait for startup
echo "15. WAITING FOR STARTUP:"
sleep 15

# Final tests
echo "16. FINAL VERIFICATION:"
pm2 list | grep prompthub
echo "Port check:"
netstat -tlnp | grep :3000
echo "HTTP test:"
curl -I http://localhost:3000 2>/dev/null || echo "Still not responding"

echo -e "\n=== RESULTS ==="
echo "API_KEY: $API_KEY"
echo "NEXT_SECRET: $NEXT_SECRET"

# Test external access
echo "Testing external access:"
curl -I http://prompt-hub.site 2>/dev/null || echo "External access failed"

echo "=== DIAGNOSIS COMPLETE ==="
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
    
    Write-Host "=== RUNNING COMPREHENSIVE DIAGNOSIS AND FIX ===" -ForegroundColor Cyan
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $diagnosticScript
    
    Write-Host $result -ForegroundColor White
    
    # Extract API key for local config
    if ($result -match "API_KEY: (.+)") {
        $apiKey = $matches[1].Trim()
        @"
API_BASE_URL=https://prompt-hub.site
API_KEY=$apiKey
"@ | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "✅ Local uploader config updated" -ForegroundColor Green
    }
    
    Write-Host "`n=== TESTING SITE ACCESSIBILITY ===" -ForegroundColor Cyan
    
    # Test multiple times with delays
    $maxAttempts = 6
    $success = $false
    
    for ($i = 1; $i -le $maxAttempts; $i++) {
        Write-Host "Test attempt $i/$maxAttempts..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 20
            Write-Host "✅ SUCCESS! Site is working - HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            $success = $true
            break
        } catch {
            Write-Host "❌ Attempt $i failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($i -lt $maxAttempts) {
                Write-Host "Waiting 10 seconds before next attempt..." -ForegroundColor Yellow
                Start-Sleep 10
            }
        }
    }
    
    if (-not $success) {
        Write-Host "⚠️ FINAL CHECK: Testing direct server access..." -ForegroundColor Yellow
        try {
            $directTest = Invoke-WebRequest "http://YOUR_SERVER_IP_HERE:3000" -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ Direct server access works - HTTP Status: $($directTest.StatusCode)" -ForegroundColor Green
            Write-Host "❌ Issue is with domain/nginx configuration" -ForegroundColor Red
        } catch {
            Write-Host "❌ Server not responding on port 3000" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ CRITICAL ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
