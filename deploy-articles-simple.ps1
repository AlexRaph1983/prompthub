$server = "83.166.244.71"
$username = "root"
$password = "yqOdhMhP41s5827h"

Write-Host "Starting deployment..." -ForegroundColor Green

$cmd = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh && npx prisma migrate deploy && npx tsx scripts/seed-articles.ts"

& .\plink.exe -batch -pw $password "$username@$server" $cmd

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Check: https://prompt-hub.site/ru/articles" -ForegroundColor Cyan

