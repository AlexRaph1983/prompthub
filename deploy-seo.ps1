# Professional deployment for SEO optimization
# Uses plink for SSH connection

$server = "root@83.166.244.71"
$pw = "VQFwmolpW3HiAg5cTd2Z"
$plink = "D:\PromptHub\plink.exe"

function Invoke-RemoteCmd {
    param([string]$cmd)
    Write-Host ">> $cmd" -ForegroundColor Cyan
    & $plink -ssh -batch -pw $pw $server $cmd
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE"
    }
}

Write-Host "=== SEO Optimization Deployment ===" -ForegroundColor Green
Write-Host "Commit: b4f356d - feat(seo): comprehensive SEO optimization" -ForegroundColor Cyan

Write-Host "`n=== 1. Change to /root/prompthub ===" -ForegroundColor Green
Invoke-RemoteCmd "cd /root/prompthub; pwd"

Write-Host "`n=== 2. Git fetch + reset --hard origin/main ===" -ForegroundColor Green
Invoke-RemoteCmd "cd /root/prompthub; git fetch origin"
Invoke-RemoteCmd "cd /root/prompthub; git reset --hard origin/main"
Invoke-RemoteCmd "cd /root/prompthub; git log -1 --oneline"

Write-Host "`n=== 3. Run deploy.sh (WITHOUT migrate/seed) ===" -ForegroundColor Green
Invoke-RemoteCmd "cd /root/prompthub; bash scripts/deploy.sh"

Write-Host "`n=== 4. Wait for restart (5 sec) ===" -ForegroundColor Green
Start-Sleep -Seconds 5

Write-Host "`n=== 5. Check PM2 status ===" -ForegroundColor Green
Invoke-RemoteCmd "pm2 list"

Write-Host "`n=== 6. Verify SEO endpoints ===" -ForegroundColor Green
Invoke-RemoteCmd "curl -sI http://localhost:3000/robots.txt | head -1"
Invoke-RemoteCmd "curl -sI http://localhost:3000/sitemap.xml | head -1"
Invoke-RemoteCmd "curl -sI http://localhost:3000/ru/marketpleys-promtov | head -1"

Write-Host "`n=== 7. Check PM2 logs (last 20 lines) ===" -ForegroundColor Green
Invoke-RemoteCmd "pm2 logs --lines 20 --nostream"

Write-Host "`n=== SEO DEPLOYMENT COMPLETED ===" -ForegroundColor Green

