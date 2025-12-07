# Deploy prompts from prompts_prompthub5.json to Orange Curium server
$server = "REDACTED_IP"
$user = "root"
$password = "REDACTED_PASSWORD"

Write-Host "DEPLOY PROMPTS PROMPTHUB5" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host "`n1. Getting changes from GitHub..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

Write-Host "`n2. Importing prompts..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && node scripts/import-prompthub5.js"

Write-Host "`n3. Deploying application..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "cd /root/prompthub && bash scripts/deploy.sh"

Write-Host "`n4. Checking status..." -ForegroundColor Yellow
& .\plink.exe -ssh -pw $password $user@$server "pm2 status"

Write-Host "`nDEPLOY COMPLETE!" -ForegroundColor Green
