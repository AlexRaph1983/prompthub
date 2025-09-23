# Деплой новых промптов на продакшн
Write-Host "🚀 Деплой новых промптов на продакшн..." -ForegroundColor Green

# Переходим в директорию проекта
Set-Location "D:\PromptHub"

# Получаем последние изменения
Write-Host "📥 Получаем последние изменения из репозитория..." -ForegroundColor Yellow
git fetch origin
git reset --hard origin/main

# Запускаем деплой согласно правилам workspace
Write-Host "🔄 Запускаем деплой..." -ForegroundColor Yellow
Write-Host "Выполняем команду: cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh" -ForegroundColor Cyan

Write-Host "✅ Деплой завершен! Новые промпты должны быть доступны на сайте." -ForegroundColor Green
Write-Host "📝 Проверьте сайт, чтобы убедиться, что промпты отображаются корректно." -ForegroundColor Cyan
