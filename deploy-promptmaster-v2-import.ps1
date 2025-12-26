# ИМПОРТ НОВЫХ ПРОМПТОВ PROMPTMASTER V2 НА ПРОДАКШЕН
Write-Host "🚀 ИМПОРТ НОВЫХ ПРОМПТОВ PROMPTMASTER V2 НА ПРОДАКШЕН" -ForegroundColor Green

# Загружаем credentials
. .\deploy-credentials.ps1

$SERVER = $env:DEPLOY_SERVER
$USER = $env:DEPLOY_USER
$PASSWORD = $env:DEPLOY_PASSWORD

Write-Host "Server: $SERVER" -ForegroundColor Yellow

# Копируем скрипт импорта
Write-Host "Copying import script..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\scripts\import-promptmaster-v2-production.js ${USER}@${SERVER}:/root/prompthub/scripts/import-promptmaster-v2-production.js

Write-Host "Copying prompts data..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\promptmaster_v2_prompts_for_import.json ${USER}@${SERVER}:/root/prompthub/promptmaster_v2_prompts_for_import.json

# Запускаем импорт
Write-Host "Running import..." -ForegroundColor Yellow
& plink.exe -ssh ${USER}@${SERVER} -pw $PASSWORD "cd /root/prompthub && node scripts/import-promptmaster-v2-production.js"

Write-Host "PROMPTMASTER V2 PROMPTS IMPORT COMPLETED!" -ForegroundColor Green
Write-Host "Check results at: http://$SERVER/ru/prompts" -ForegroundColor White

