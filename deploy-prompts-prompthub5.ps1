# Безопасный deployment скрипт
# Credentials должны быть установлены через environment variables:
#   $env:DEPLOY_SERVER - IP сервера
#   $env:DEPLOY_USER - имя пользователя (по умолчанию root)
#   $env:DEPLOY_PASSWORD - пароль
# Или можно передать параметрами при запуске

param(
    [string]$Server = $env:DEPLOY_SERVER,
    [string]$User = $(if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { "root" }),
    [string]$Password = $env:DEPLOY_PASSWORD
)

$ErrorActionPreference = "Stop"

# Проверка credentials
if (-not $Server) {
    Write-Error "ERROR: Server IP not set. Set `$env:DEPLOY_SERVER or pass -Server parameter"
    exit 1
}

if (-not $Password) {
    Write-Error "ERROR: Password not set. Set `$env:DEPLOY_PASSWORD or pass -Password parameter"
    exit 1
}

# Путь к plink
$plink = ".\plink.exe"
if (-not (Test-Path $plink)) {
    $plink = "plink.exe"
}

function Run-RemoteCommand {
    param([string]$Command, [string]$Description)
    
    Write-Host "`n[$Description]" -ForegroundColor Cyan
    Write-Host "Executing: $Command" -ForegroundColor Gray
    
    $result = echo y | & $plink -ssh -pw $Password "${User}@${Server}" $Command 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -ne 0) {
        Write-Host "FAILED! Exit code: $exitCode" -ForegroundColor Red
        Write-Host "Output: $result" -ForegroundColor Red
        throw "Command failed: $Description (exit code: $exitCode)"
    }
    
    Write-Host "SUCCESS" -ForegroundColor Green
    return $result
}

try {
    Write-Host "=== Starting Deployment ===" -ForegroundColor Yellow
    Write-Host "Server: $Server" -ForegroundColor White
    Write-Host "User: $User" -ForegroundColor White
    
    # Step 1: Git fetch and reset
    Run-RemoteCommand "cd /root/prompthub && git fetch origin && git reset --hard origin/main" "Git: Fetch and reset to origin/main"
    
    # Step 2: Deploy
    Run-RemoteCommand "cd /root/prompthub && bash scripts/deploy.sh" "Running deploy script"
    
    Write-Host "`n=== Deployment completed successfully! ===" -ForegroundColor Green
    
} catch {
    Write-Host "`n=== DEPLOYMENT FAILED ===" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
