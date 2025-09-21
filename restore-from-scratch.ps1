$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$restoreScript = @'
#!/bin/bash
set -e

echo "=== EMERGENCY RESTORE FROM SCRATCH ==="

# Kill all PM2 processes
pm2 kill || true

# Go to root and check if prompthub exists
cd /root
if [ ! -d "prompthub" ]; then
    echo "Directory /root/prompthub missing! Cloning from repository..."
    git clone https://github.com/your-username/prompthub.git prompthub || {
        echo "Git clone failed. Creating directory manually..."
        mkdir -p prompthub
        cd prompthub
        git init
        git remote add origin https://github.com/your-username/prompthub.git
        git fetch origin
        git reset --hard origin/main
    }
else
    cd prompthub
    echo "Directory exists, updating..."
    git fetch origin || true
    git reset --hard origin/main || true
fi

# Ensure we're in the right directory
pwd
ls -la

# Clean install
echo "Clean installation..."
rm -rf node_modules .next
npm install

# Simple build without admin API
echo "Building application..."
npm run build

# Create minimal working ecosystem config
echo "Creating minimal PM2 configuration..."
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
      NEXTAUTH_SECRET: 'minimal-secret-for-working-site'
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# Start with working config
echo "Starting PM2..."
pm2 start ecosystem.config.js
pm2 save

# Wait for startup
echo "Waiting for application to start..."
sleep 30

# Test
echo "Testing application..."
curl -I http://localhost:3000 || echo "Not responding yet"

echo "PM2 Status:"
pm2 list

echo "Port check:"
netstat -tlnp | grep :3000

echo "=== RESTORATION COMPLETE ==="
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
    
    Write-Host "=== EMERGENCY RESTORE FROM SCRATCH ===" -ForegroundColor Red
    Write-Host "Restoring application from repository..." -ForegroundColor Yellow
    
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $restoreScript
    Write-Host $result -ForegroundColor White
    
    Write-Host "`n=== TESTING RESTORED APPLICATION ===" -ForegroundColor Cyan
    
    # Test the restored application
    $maxAttempts = 20
    $siteRestored = $false
    
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        Write-Host "Testing restored application - attempt $attempt/$maxAttempts..." -ForegroundColor Yellow
        Start-Sleep 15
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 25
            Write-Host "🎉 SITE SUCCESSFULLY RESTORED FROM SCRATCH!" -ForegroundColor Green
            Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔄 Application restored to basic working state" -ForegroundColor White
            $siteRestored = $true
            break
        } catch {
            Write-Host "❌ Attempt $attempt failed: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Red
        }
    }
    
    if (-not $siteRestored) {
        Write-Host "`n⚠️ Final diagnostic check..." -ForegroundColor Yellow
        try {
            $directTest = Invoke-WebRequest "http://83.166.244.71:3000" -UseBasicParsing -TimeoutSec 15
            Write-Host "✅ Direct server access works: $($directTest.StatusCode)" -ForegroundColor Green
            Write-Host "❌ Issue is with domain/nginx configuration" -ForegroundColor Red
        } catch {
            Write-Host "❌ Server still not responding on port 3000" -ForegroundColor Red
            
            # Get final diagnostic info
            Write-Host "Getting final diagnostic information..." -ForegroundColor Yellow
            $diagnostic = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && pwd && ls -la && pm2 logs prompthub --lines 10 --nostream && pm2 describe prompthub'
            Write-Host $diagnostic -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ EMERGENCY RESTORATION FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
