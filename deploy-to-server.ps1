Param(
  [string]$Server = "REDACTED_IP",
  [string]$User = "root",
  [int]$Port = 22
)

$ErrorActionPreference = "Stop"

function Invoke-RemoteCommand {
  param([string]$Cmd)
  $target = "$User@$Server"
  & ssh -o StrictHostKeyChecking=no -p $Port $target bash -lc $Cmd
}

$snapshotCmd = 'SNAP=/root/backup_prompthub_$(date +%Y%m%d-%H%M%S); mkdir -p "$SNAP"; cd /root; tar -czf "$SNAP/prompthub.tgz" prompthub || true; if [ -f /root/prompthub/prisma/dev.db ]; then cp /root/prompthub/prisma/dev.db "$SNAP/dev.db"; fi; echo Snapshot: $SNAP'
Write-Host "Creating remote snapshot..." -ForegroundColor Cyan
Invoke-RemoteCommand $snapshotCmd

$deployCmd = 'cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh'
Write-Host "Deploying per workspace rules..." -ForegroundColor Green
Invoke-RemoteCommand $deployCmd

Write-Host "Health check" -ForegroundColor Green
try {
  $resp = Invoke-WebRequest -Uri ("http://" + $Server + "/api/health") -UseBasicParsing -TimeoutSec 15
  Write-Host ("Health: " + $resp.StatusCode + " " + $resp.Content)
} catch {
  Write-Host ("Health check failed: " + $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host "PM2 last logs" -ForegroundColor Green
$logsCmd = 'pm2 logs prompthub --lines 50 --nostream || true'
Invoke-RemoteCommand $logsCmd
