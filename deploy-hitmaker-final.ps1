# ФИНАЛЬНЫЙ ИМПОРТ ПРОМПТОВ HITMAKER
Write-Host "🚀 ФИНАЛЬНЫЙ ИМПОРТ ПРОМПТОВ HITMAKER" -ForegroundColor Green

# Загружаем credentials
. .\deploy-credentials.ps1

$SERVER = $env:DEPLOY_SERVER
$USER = $env:DEPLOY_USER
$PASSWORD = $env:DEPLOY_PASSWORD

Write-Host "Server: $SERVER" -ForegroundColor Yellow

# Копируем скрипт импорта
Write-Host "Copying import script..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\scripts\import-hitmaker-production.js ${USER}@${SERVER}:/root/import-hitmaker-production.js

Write-Host "Copying prompts data..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\hitmaker_prompts_for_import.json ${USER}@${SERVER}:/root/hitmaker_prompts_for_import.json

Write-Host "Copying remote script..." -ForegroundColor Yellow
& pscp.exe -pw $PASSWORD .\import-hitmaker-remote.sh ${USER}@${SERVER}:/root/import-hitmaker-remote.sh

# Делаем скрипт исполняемым и запускаем
Write-Host "Running import..." -ForegroundColor Yellow
& plink.exe -ssh ${USER}@${SERVER} -pw $PASSWORD "chmod +x /root/import-hitmaker-remote.sh && /root/import-hitmaker-remote.sh"

Write-Host "HITMAKER PROMPTS IMPORT COMPLETED!" -ForegroundColor Green
Write-Host "Check results at: http://$SERVER/ru/prompts" -ForegroundColor Cyan