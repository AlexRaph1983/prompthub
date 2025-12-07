# Quick deploy script - uses credentials from deploy-credentials.ps1
# Usage: 
#   1. . .\deploy-credentials.ps1   (load credentials)
#   2. .\deploy-now.ps1              (run deploy)

$ErrorActionPreference = "Stop"

if (-not $env:DEPLOY_PASSWORD -or -not $env:DEPLOY_SERVER) {
    Write-Host "ERROR: Credentials not loaded!" -ForegroundColor Red
    Write-Host "Run first: . .\deploy-credentials.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying to $env:DEPLOY_SERVER..." -ForegroundColor Cyan

$plinkPath = "D:\PromptHub\plink.exe"
$deployCmd = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

& $plinkPath -ssh -batch -pw $env:DEPLOY_PASSWORD "$env:DEPLOY_USER@$env:DEPLOY_SERVER" $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Deploy failed!" -ForegroundColor Red
}
