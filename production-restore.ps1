$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$restoreScript = @'
#!/bin/bash
set -euo pipefail

echo "🚨 PRODUCTION EMERGENCY RESTORE"
echo "==============================="

cd /root/prompthub

# Define SAFE_POINT
SAFE_POINT="edd5c04"
echo "🎯 Target SAFE_POINT: $SAFE_POINT"

# Stop current PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 kill || true

# Create backup branch of current state
echo "💾 Creating backup branch..."
git add . || true
git commit -m "Backup before emergency restore $(date)" || true
git branch backup/before-restore-$(date +%Y%m%d-%H%M%S) || true

# Switch to SAFE_POINT
echo "⏪ Switching to SAFE_POINT..."
git fetch origin
git reset --hard $SAFE_POINT

# Clean environment
echo "🧹 Cleaning environment..."
rm -rf node_modules .next

# Install dependencies
echo "📦 Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile
else
    npm ci
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build application
echo "🏗️ Building application..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm build
else
    npm run build
fi

# Create production PM2 config
echo "⚙️ Creating PM2 config..."
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
      NEXTAUTH_SECRET: 'production-secret-key'
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# Start PM2
echo "🚀 Starting PM2..."
pm2 start ecosystem.config.js
pm2 save

# Wait for startup
echo "⏳ Waiting for application startup..."
sleep 30

# Test local response
echo "🧪 Testing local response..."
curl -I http://localhost:3000 || echo "Local test failed"

echo ""
echo "✅ PRODUCTION RESTORE COMPLETE!"
echo "==============================="
echo "📊 Status:"
echo "- Commit: $(git rev-parse --short HEAD)"
echo "- PM2 Status:"
pm2 list
echo "- Port Status:"
netstat -tlnp | grep :3000 || echo "Port 3000 not found"

echo ""
echo "🔍 Final verification:"
echo "- Site should be accessible at: https://prompt-hub.site"
echo "- Check PM2 logs: pm2 logs prompthub"
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
    
    Write-Host "🚨 STARTING PRODUCTION EMERGENCY RESTORE" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "Target: Restore to SAFE_POINT edd5c04" -ForegroundColor Yellow
    Write-Host "Server: $Server" -ForegroundColor Yellow
    
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $restoreScript
    Write-Host $result -ForegroundColor White
    
    Write-Host "`n🧪 TESTING RESTORED SITE..." -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    # Test the restored site multiple times
    $maxAttempts = 15
    $siteRestored = $false
    
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        Write-Host "🔍 Site test $attempt/$maxAttempts..." -ForegroundColor Yellow
        Start-Sleep 10
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 25
            Write-Host "🎉 SITE SUCCESSFULLY RESTORED!" -ForegroundColor Green
            Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            Write-Host "📋 Restored to SAFE_POINT: edd5c04" -ForegroundColor White
            $siteRestored = $true
            break
        } catch {
            Write-Host "❌ Attempt $attempt failed: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Red
        }
    }
    
    if ($siteRestored) {
        Write-Host "`n🎯 EMERGENCY RESTORE SUCCESSFUL!" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        Write-Host "✅ Site is now operational" -ForegroundColor Green
        Write-Host "✅ Restored to stable version (edd5c04)" -ForegroundColor Green
        Write-Host "✅ PM2 process running" -ForegroundColor Green
        
        Write-Host "`n📋 Next steps:" -ForegroundColor White
        Write-Host "1. Monitor site stability" -ForegroundColor White
        Write-Host "2. Fix admin API in separate branch" -ForegroundColor White
        Write-Host "3. Set up CI/CD to prevent future regressions" -ForegroundColor White
    } else {
        Write-Host "`n❌ SITE STILL NOT ACCESSIBLE" -ForegroundColor Red
        Write-Host "=============================" -ForegroundColor Red
        Write-Host "Need additional investigation..." -ForegroundColor Yellow
        
        # Get diagnostic info
        Write-Host "`n🔍 Getting diagnostic information..." -ForegroundColor Yellow
        $diagnostic = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && echo "=== PM2 STATUS ===" && pm2 list && echo "=== PM2 LOGS ===" && pm2 logs prompthub --lines 20 --nostream && echo "=== PORT CHECK ===" && netstat -tlnp | grep :3000'
        Write-Host $diagnostic -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ PRODUCTION RESTORE FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
