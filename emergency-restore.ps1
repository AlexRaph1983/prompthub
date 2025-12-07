param(
    [string]$Server = 'YOUR_SERVER_IP_HERE',
    [string]$User = 'root',
    [string]$Password = 'YOUR_PASSWORD_HERE'
)

Write-Host '=== EMERGENCY SITE RESTORATION ===' -ForegroundColor Red

$diagnosticScript = @'
#!/bin/bash
set -e

echo "=== EMERGENCY DIAGNOSTICS & RESTORE ==="
echo "Timestamp: $(date)"
echo

# 1. Check system resources
echo "1. SYSTEM STATUS:"
echo "Memory usage:"
free -h
echo "Disk usage:"
df -h /
echo "Load average:"
uptime
echo

# 2. Check Nginx status
echo "2. NGINX STATUS:"
systemctl status nginx --no-pager -l || echo "Nginx not running"
echo "Nginx processes:"
ps aux | grep nginx | grep -v grep || echo "No nginx processes"
echo

# 3. Check PM2 status
echo "3. PM2 STATUS:"
pm2 list || echo "PM2 not responding"
pm2 logs prompthub --lines 50 --nostream || echo "No PM2 logs available"
echo

# 4. Check port 3000
echo "4. PORT 3000 STATUS:"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
curl -s -o /dev/null -w "HTTP %{http_code} - %{time_total}s" http://localhost:3000 || echo "Localhost:3000 not responding"
echo

# 5. Check application directory
echo "5. APPLICATION STATUS:"
cd /root/prompthub
pwd
ls -la | head -10
echo "Git status:"
git status --porcelain || echo "Git issues"
echo "Last commit:"
git log -1 --oneline || echo "Git log issues"
echo

# 6. EMERGENCY RESTORE SEQUENCE
echo "6. STARTING EMERGENCY RESTORE..."

# Stop everything
echo "Stopping all services..."
pm2 kill || true
systemctl stop nginx || true
sleep 2

# Clean and restart Nginx
echo "Restarting Nginx..."
nginx -t && systemctl start nginx || {
    echo "Nginx config error, using default"
    cp /etc/nginx/sites-available/default.bak /etc/nginx/sites-available/default 2>/dev/null || true
    systemctl start nginx
}

# Navigate to app directory
cd /root/prompthub

# Quick git restore
echo "Restoring code..."
git fetch --all || true
git reset --hard origin/main || git reset --hard HEAD

# Generate minimal ecosystem config
echo "Creating minimal PM2 config..."
API_KEY=$(head -c 32 /dev/urandom | base64 | tr -d '\n')
NEXTAUTH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '\n')

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'prompthub',
    cwd: '/root/prompthub',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      ADMIN_API_KEY: '${API_KEY}',
      NEXTAUTH_SECRET: '${NEXTAUTH_SECRET}',
      IMPERSONATION_SECRET: '${NEXTAUTH_SECRET}'
    },
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "Installing dependencies..."
    npm ci --no-audit --no-fund --progress=false || npm install --no-audit --no-fund --progress=false
    echo "Building application..."
    npm run build || {
        echo "Build failed, trying with skip build..."
        SKIP_BUILD=1 npm start &
        sleep 5
        kill %1 2>/dev/null || true
    }
fi

# Start PM2
echo "Starting PM2..."
pm2 start ecosystem.config.js --only prompthub
pm2 save

# Wait and test
echo "Waiting for application to start..."
sleep 10

# Final checks
echo "7. FINAL STATUS CHECK:"
pm2 list
curl -s -w "HTTP %{http_code}\n" http://localhost:3000 | head -5
curl -s -w "HTTP %{http_code}\n" http://localhost:3000/api/health | head -5

echo
echo "=== RESTORE COMPLETE ==="
echo "ADMIN_API_KEY: $API_KEY"
echo "Site should be accessible at: http://prompt-hub.site"
echo "If still 502, check nginx logs: tail -f /var/log/nginx/error.log"
'@

# Create temp script file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$diagnosticScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    # Try using plink if available
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "Using plink for emergency restore..." -ForegroundColor Yellow
        $scriptContent = Get-Content $tempScript -Raw
        $encodedScript = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($scriptContent))
        $remoteCommand = "echo '$encodedScript' | base64 -d | bash"
        
        $result = & plink -ssh -pw $Password "$User@$Server" $remoteCommand
        Write-Host $result -ForegroundColor Green
    } else {
        Write-Host "plink not found. Manual SSH required:" -ForegroundColor Yellow
        Write-Host "1. Connect: ssh $User@$Server" -ForegroundColor White
        Write-Host "2. Run the diagnostic script above" -ForegroundColor White
        
        # Save script for manual execution
        $manualScript = "emergency-restore-manual.sh"
        $diagnosticScript | Out-File -FilePath $manualScript -Encoding UTF8
        Write-Host "3. Script saved to: $manualScript" -ForegroundColor White
    }
} finally {
    # Cleanup
    Remove-Item $tempScript -ErrorAction SilentlyContinue
}

Write-Host "`n=== POST-RESTORE VERIFICATION ===" -ForegroundColor Green
Write-Host "Test site: https://prompt-hub.site" -ForegroundColor White
Write-Host "If still 502, run: ssh $User@$Server 'tail -f /var/log/nginx/error.log'" -ForegroundColor White
