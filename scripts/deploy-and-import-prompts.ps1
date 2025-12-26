# PowerShell скрипт для деплоя и импорта промптов на продакшн
# Использование: .\scripts\deploy-and-import-prompts.ps1

$ErrorActionPreference = "Stop"

# Параметры подключения (замените на реальные)
$ServerIP = "REDACTED_IP"  # Замените на реальный IP
$ServerUser = "root"
$ServerPassword = "REDACTED_PASSWORD"  # Замените на реальный пароль

Write-Host "=== Deploying to production ===" -ForegroundColor Green

# Команда для выполнения на сервере
$deployCommand = @"
cd /root/prompthub && \
git fetch origin && \
git reset --hard origin/main && \
bash scripts/deploy.sh && \
sleep 5 && \
node scripts/import-prompts-from-file-safe.js --file=data/generated_prompts_ru_300.json --authorEmail=content-architect@prompthub.local --dryRun=false --batch=25 && \
node scripts/verify-import.js --authorEmail=content-architect@prompthub.local
"@

try {
    # Используем sshpass или plink для подключения с паролем
    # Если sshpass установлен:
    # sshpass -p "$ServerPassword" ssh -o StrictHostKeyChecking=no ${ServerUser}@${ServerIP} $deployCommand
    
    # Или используем plink (PuTTY):
    # echo y | plink -ssh -pw "$ServerPassword" ${ServerUser}@${ServerIP} -m <(echo "$deployCommand")
    
    # Или через SSH ключ (рекомендуется):
    Write-Host "Connecting to $ServerUser@$ServerIP..." -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no ${ServerUser}@${ServerIP} $deployCommand
    
    Write-Host "=== Deployment complete ===" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Please run manually:" -ForegroundColor Yellow
    Write-Host "ssh root@SERVER_IP" -ForegroundColor Cyan
    Write-Host "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh" -ForegroundColor Cyan
    Write-Host "node scripts/import-prompts-from-file-safe.js --file=data/generated_prompts_ru_300.json --authorEmail=content-architect@prompthub.local --dryRun=false --batch=25" -ForegroundColor Cyan
    Write-Host "node scripts/verify-import.js --authorEmail=content-architect@prompthub.local" -ForegroundColor Cyan
    exit 1
}

