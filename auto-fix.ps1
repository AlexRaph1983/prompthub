param(
    [string]$Server = '83.166.244.71',
    [string]$User = 'root',
    [string]$Password = 'yqOdhMhP41s5827h'
)

$ErrorActionPreference = 'Stop'

# Install plink if not available
if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    Write-Host "Installing PuTTY tools..." -ForegroundColor Yellow
    $url = "https://the.earth.li/~sgtatham/putty/latest/w64/putty.zip"
    $zip = "$env:TEMP\putty.zip"
    $extract = "$env:TEMP\putty"
    
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $extract -Force
    
    $env:PATH = "$extract;$env:PATH"
    $plinkPath = "$extract\plink.exe"
} else {
    $plinkPath = "plink"
}

$fixScript = @'
#!/bin/bash
set -euo pipefail

echo "=== AUTO-FIX STARTING ==="

# Kill all PM2 processes
pm2 kill >/dev/null 2>&1 || true

# Restart nginx
systemctl restart nginx

# Go to app
cd /root/prompthub

# Force clean state
git fetch --all >/dev/null 2>&1 || true
git reset --hard origin/main >/dev/null 2>&1 || true

# Generate secrets
API_KEY=$(openssl rand -base64 32 | tr -d '\n')
SECRET=$(openssl rand -base64 32 | tr -d '\n')

# Create working config
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
      ADMIN_API_KEY: process.env.ADMIN_API_KEY,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      IMPERSONATION_SECRET: process.env.NEXTAUTH_SECRET
    },
    autorestart: true,
    max_restarts: 3,
    min_uptime: '5s'
  }]
}
EOF

# Set environment
export ADMIN_API_KEY="$API_KEY"
export NEXTAUTH_SECRET="$SECRET"
export IMPERSONATION_SECRET="$SECRET"

# Install deps if missing
if [ ! -d node_modules ]; then
    npm install --production >/dev/null 2>&1
fi

# Build if missing
if [ ! -d .next ]; then
    npm run build >/dev/null 2>&1 || true
fi

# Start PM2
pm2 start ecosystem.config.js >/dev/null 2>&1
pm2 save >/dev/null 2>&1

# Wait for startup
sleep 8

# Test
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$STATUS" = "200" ]; then
    echo "SUCCESS: Site restored"
    echo "API_KEY: $API_KEY"
    echo "Status: $STATUS"
else
    echo "PARTIAL: Status $STATUS"
    echo "API_KEY: $API_KEY"
    pm2 logs prompthub --lines 5 --nostream 2>/dev/null || true
fi
'@

try {
    Write-Host "Executing auto-fix..." -ForegroundColor Green
    
    # Execute via plink
    $result = & $plinkPath -ssh -pw $Password -batch "$User@$Server" $fixScript 2>&1
    
    Write-Host $result -ForegroundColor White
    
    # Extract API key from result
    if ($result -match "API_KEY: (.+)") {
        $apiKey = $matches[1].Trim()
        
        # Update local uploader config
        $envContent = @"
API_BASE_URL=https://prompt-hub.site
API_KEY=$apiKey
"@
        $envContent | Out-File -FilePath "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "Updated local uploader config" -ForegroundColor Green
    }
    
    # Test site
    Write-Host "Testing site..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://prompt-hub.site" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ SITE RESTORED SUCCESSFULLY" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Site responding with status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Site still not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Auto-fix failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
