# ДЕПЛОЙ ПРОМПТОВ HITMAKER
Write-Host "🚀 ДЕПЛОЙ ПРОМПТОВ HITMAKER" -ForegroundColor Green

# Загружаем credentials
. .\deploy-credentials.ps1

$SERVER = $env:DEPLOY_SERVER
$USER = $env:DEPLOY_USER
$PASSWORD = $env:DEPLOY_PASSWORD

Write-Host "📡 Подключаемся к серверу $SERVER..." -ForegroundColor Yellow

# Используем plink для выполнения команд
$plinkPath = "plink.exe"

# Команды для выполнения
$commands = @(
    "cd /root/prompthub && git fetch origin && git reset --hard origin/main",
    "cd /root/prompthub && npm ci",
    "cd /root/prompthub && npx prisma generate",
    "cd /root/prompthub && npm run build",
    "cd /root/prompthub && pm2 restart prompthub",
    "cd /root/prompthub && pm2 status"
)

$steps = @("Обновляем код", "Устанавливаем зависимости", "Генерируем Prisma", "Собираем проект", "Перезапускаем", "Проверяем статус")

for ($i = 0; $i -lt $commands.Length; $i++) {
    Write-Host "`n$($i+1)️⃣ $($steps[$i])..." -ForegroundColor Yellow
    & $plinkPath -ssh ${USER}@${SERVER} -pw $PASSWORD $commands[$i]
}

Write-Host "`nDEPLOY HITMAKER PROMPTS COMPLETED!" -ForegroundColor Green
Write-Host "`nCheck new prompts at:" -ForegroundColor Cyan
Write-Host "   http://$SERVER/ru/prompts" -ForegroundColor White
