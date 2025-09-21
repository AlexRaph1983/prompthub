# Simple Deployment Script
$server = $env:DEPLOY_SERVER_IP
$username = $env:DEPLOY_SSH_USER
$password = $env:DEPLOY_SSH_PASS

Write-Host "Deploying to $server..." -ForegroundColor Green

$commands = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh && echo 'Done'"

Write-Host "Commands: $commands" -ForegroundColor Yellow

if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "Executing via plink..." -ForegroundColor Cyan
    & plink -ssh -batch -pw $password $username@$server $commands
    Write-Host "Deployment completed!" -ForegroundColor Green
} else {
    Write-Host "plink not found. Manual connection required:" -ForegroundColor Red
    Write-Host "ssh $username@$server" -ForegroundColor White
}

Write-Host "Check: http://$server" -ForegroundColor Green
