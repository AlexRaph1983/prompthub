# ИМПОРТ ПРОМПТОВ HITMAKER НА ПРОДАКШЕН
Write-Host "🚀 ИМПОРТ ПРОМПТОВ HITMAKER НА ПРОДАКШЕН" -ForegroundColor Green

# Загружаем credentials
. .\deploy-credentials.ps1

$SERVER = $env:DEPLOY_SERVER
$USER = $env:DEPLOY_USER
$PASSWORD = $env:DEPLOY_PASSWORD

Write-Host "Server: $SERVER" -ForegroundColor Yellow

# Копируем файлы на сервер
Write-Host "Copying import script..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\scripts\import-hitmaker-production.js ${USER}@${SERVER}:/root/import-hitmaker-production.js

Write-Host "Copying prompts data..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\hitmaker_prompts_for_import.json ${USER}@${SERVER}:/root/hitmaker_prompts_for_import.json

# Запускаем импорт
Write-Host "Running import..." -ForegroundColor Yellow
& plink.exe -ssh ${USER}@${SERVER} -pw $PASSWORD "cd /root/prompthub && node ../import-hitmaker-production.js"

Write-Host "HITMAKER PROMPTS IMPORT COMPLETED!" -ForegroundColor Green
Write-Host "Check results at: http://$SERVER/ru/prompts" -ForegroundColor Cyan
