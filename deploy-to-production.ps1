# Professional deployment to Orange Curium (83.166.244.71)
# Without migrate/seed, with 300 prompts import

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

Write-Host "=== 1. Change to /root/prompthub ===" -ForegroundColor Green
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

Write-Host "`n=== 6. Delete old content-architect prompts ===" -ForegroundColor Green
Invoke-RemoteCmd "cd /root/prompthub; node scripts/delete-content-architect-prompts.js"

Write-Host "`n=== 7. Import 300 new prompts ===" -ForegroundColor Green
Invoke-RemoteCmd "cd /root/prompthub; node scripts/import-prompts-from-file-safe.js --file=data/generated_prompts_ru_300.json --authorEmail=content-architect@prompthub.local --dryRun=false --batch=25"

Write-Host "`n=== 8. Verify import ===" -ForegroundColor Green
Invoke-RemoteCmd "cd /root/prompthub; node scripts/verify-import.js --authorEmail=content-architect@prompthub.local"

Write-Host "`n=== 9. Check PM2 logs (last 30 lines) ===" -ForegroundColor Green
Invoke-RemoteCmd "pm2 logs --lines 30 --nostream"

Write-Host "`n=== DEPLOYMENT COMPLETED ===" -ForegroundColor Green
