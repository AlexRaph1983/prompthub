Param(
  [string]$Server = "REDACTED_IP",
  [string]$User = "root",
  [int]$Port = 22
)

$ErrorActionPreference = "Stop"

function Invoke-RemoteBash {
  param([string]$BashInline)
  $target = "$User@$Server"
  $escaped = $BashInline.Replace("`"", "\`"")
  & ssh -o StrictHostKeyChecking=no -p $Port $target "bash -lc \"$escaped\""
}

Write-Host "Creating remote snapshot..." -ForegroundColor Cyan
Invoke-RemoteBash @"
set -e
SNAP="/root/backup_prompthub_$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SNAP"
cd /root/prompthub
tar -czf "$SNAP/code.tgz" . || true
if [ -f prisma/dev.db ]; then cp prisma/dev.db "$SNAP/dev.db"; fi
echo "Snapshot: $SNAP"
"@

Write-Host "Deploying per workspace rules..." -ForegroundColor Green
Invoke-RemoteBash "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

Write-Host "Health check" -ForegroundColor Green
try {
  $resp = Invoke-WebRequest -Uri ("http://" + $Server + "/api/health") -UseBasicParsing -TimeoutSec 10
  Write-Host ("Health: " + $resp.StatusCode + " " + $resp.Content)
} catch {
  Write-Host ("Health check failed: " + $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host "PM2 last logs" -ForegroundColor Green
Invoke-RemoteBash "pm2 logs prompthub --lines 50 --nostream || true"

# Deploy to Production Server
# Автоматический деплой исправленной версии на сервер

$SERVER_IP = "REDACTED_IP"
$SERVER_USER = "root"
$SERVER_PASSWORD = "REDACTED_PASSWORD"

Write-Host "🚀 Starting deployment to production server..." -ForegroundColor Green

# Создаем SSH команды для выполнения на сервере
$deployCommands = @"
cd /root/prompthub && \
git fetch origin && \
git reset --hard origin/main && \
npm install && \
npm run build && \
pm2 stop prompthub || true && \
pm2 delete prompthub || true && \
pm2 start ecosystem.config.js && \
pm2 save && \
systemctl restart nginx && \
echo "✅ Deployment completed successfully!"
"@

Write-Host "📦 Deploying latest version with fixes..." -ForegroundColor Yellow

# Используем plink для выполнения команд на сервере
try {
    # Проверяем доступность plink
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    if (-not $plinkPath) {
        Write-Host "❌ PuTTY plink not found. Please install PuTTY or use manual SSH." -ForegroundColor Red
        Write-Host "Manual deployment commands:" -ForegroundColor Yellow
        Write-Host $deployCommands -ForegroundColor Gray
        exit 1
    }
    
    # Выполняем деплой через plink
    $result = & plink -ssh -batch -pw $SERVER_PASSWORD $SERVER_USER@$SERVER_IP $deployCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Site should be available at: http://$SERVER_IP" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Deployment failed. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manual deployment commands:" -ForegroundColor Yellow
    Write-Host $deployCommands -ForegroundColor Gray
}

Write-Host "`n📋 Manual deployment instructions:" -ForegroundColor Yellow
Write-Host "1. SSH to server: ssh root@$SERVER_IP" -ForegroundColor Gray
Write-Host "2. Run these commands:" -ForegroundColor Gray
Write-Host $deployCommands -ForegroundColor Gray
