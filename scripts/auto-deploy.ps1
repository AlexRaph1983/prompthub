# Автоматический деплой с использованием plink (PuTTY Link)
param(
    [string]$ServerIP = "83.166.244.71",
    [string]$Username = "root",
    [string]$Password = "yqOdhMhP41s5827h"
)

Write-Host "🚀 АВТОМАТИЧЕСКИЙ ДЕПЛОЙ НА СЕРВЕР" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Проверяем наличие plink
if (-not (Test-Path "plink.exe")) {
    Write-Host "❌ plink.exe не найден. Скачиваем..." -ForegroundColor Red
    # Можно добавить автоматическое скачивание plink
    Write-Host "Пожалуйста, скачайте plink.exe и поместите в корень проекта" -ForegroundColor Yellow
    exit 1
}

$commands = @(
    "cd /root/prompthub && git fetch origin && git reset --hard origin/main",
    "cd /root/prompthub && npm install",
    "cd /root/prompthub && npx prisma generate",
    "cd /root/prompthub && npx prisma db push --accept-data-loss",
    "cd /root/prompthub && npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json",
    "cd /root/prompthub && npm run build",
    "cd /root/prompthub && pm2 stop prompthub || true && pm2 delete prompthub || true && pm2 start ecosystem.config.js || pm2 start npm --name 'prompthub' -- start",
    "cd /root/prompthub && pm2 save"
)

$stepNames = @(
    "1. Обновление кода",
    "2. Установка зависимостей", 
    "3. Обновление Prisma",
    "4. Обновление базы данных",
    "5. Импорт промптов",
    "6. Сборка приложения",
    "7. Перезапуск приложения",
    "8. Сохранение конфигурации"
)

for ($i = 0; $i -lt $commands.Length; $i++) {
    Write-Host "`n$($stepNames[$i])..." -ForegroundColor Yellow
    
    try {
        $result = & .\plink.exe -ssh -pw $Password $Username@$ServerIP $commands[$i] 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $($stepNames[$i]) - УСПЕШНО" -ForegroundColor Green
        } else {
            Write-Host "❌ $($stepNames[$i]) - ОШИБКА" -ForegroundColor Red
            Write-Host "Результат: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($stepNames[$i]) - ИСКЛЮЧЕНИЕ: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🔍 ПРОВЕРКА РЕЗУЛЬТАТА..." -ForegroundColor Green

# Проверяем API
try {
    $response = Invoke-WebRequest -Uri "http://$ServerIP:3000/api/prompts?limit=10" -UseBasicParsing -TimeoutSec 10
    $prompts = $response.Content | ConvertFrom-Json
    Write-Host "✅ API работает. Найдено промптов: $($prompts.items.Count)" -ForegroundColor Green
    
    # Проверяем наличие новых промптов
    $newPrompts = $prompts.items | Where-Object { $_.title -like "*питание*" -or $_.title -like "*тренировка*" -or $_.title -like "*бюджет*" }
    if ($newPrompts.Count -gt 0) {
        Write-Host "🎉 НОВЫЕ ПРОМПТЫ НАЙДЕНЫ НА САЙТЕ!" -ForegroundColor Green
        $newPrompts | ForEach-Object { Write-Host "  • $($_.title)" -ForegroundColor Cyan }
    } else {
        Write-Host "⚠️  Новые промпты не найдены. Возможно, импорт не прошел." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка при проверке API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🌐 Сайт: http://$ServerIP:3000" -ForegroundColor Cyan
Write-Host "📊 API: http://$ServerIP:3000/api/prompts?limit=10" -ForegroundColor Cyan
