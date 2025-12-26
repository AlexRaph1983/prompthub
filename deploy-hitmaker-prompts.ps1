# ДЕПЛОЙ ПРОМПТОВ HITMAKER
Write-Host "🚀 ДЕПЛОЙ ПРОМПТОВ HITMAKER" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Загружаем credentials
. .\deploy-credentials.ps1

$SERVER = $env:DEPLOY_SERVER
$USER = $env:DEPLOY_USER
$PASSWORD = $env:DEPLOY_PASSWORD

Write-Host "`n📡 Подключаемся к серверу $SERVER..." -ForegroundColor Yellow

# Используем plink для выполнения команд
$plinkPath = Join-Path $PSScriptRoot "plink.exe"

if (!(Test-Path $plinkPath)) {
    Write-Host "❌ plink.exe не найден!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Найден plink.exe" -ForegroundColor Green

# 1. Обновляем код
Write-Host "`n1️⃣ Обновляем код..." -ForegroundColor Yellow
$command1 = "cd /root/prompthub && git fetch origin && git reset --hard origin/main"
& $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $command1

# 2. Устанавливаем зависимости
Write-Host "`n2️⃣ Устанавливаем зависимости..." -ForegroundColor Yellow
$command2 = "cd /root/prompthub && npm ci"
& $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $command2

# 3. Генерируем Prisma
Write-Host "`n3️⃣ Генерируем Prisma клиент..." -ForegroundColor Yellow
$command3 = "cd /root/prompthub && npx prisma generate"
& $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $command3

# 4. Собираем проект
Write-Host "`n4️⃣ Собираем проект..." -ForegroundColor Yellow
$command4 = "cd /root/prompthub && npm run build"
& $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $command4

# 5. Перезапускаем приложение
Write-Host "`n5️⃣ Перезапускаем приложение..." -ForegroundColor Yellow
$command5 = "cd /root/prompthub && pm2 restart prompthub"
& $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $command5

# 6. Проверяем статус
Write-Host "`n6️⃣ Проверяем статус..." -ForegroundColor Yellow
$command6 = "cd /root/prompthub && pm2 status"
& $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $command6

Write-Host "`n🎉 ДЕПЛОЙ ПРОМПТОВ HITMAKER ЗАВЕРШЁН!" -ForegroundColor Green
Write-Host "`n📋 Проверьте новые промпты на сайте:" -ForegroundColor Cyan
Write-Host "   http://$SERVER/ru/prompts" -ForegroundColor White

