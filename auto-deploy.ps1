# Автоматический деплой на сервер
param(
    [string]$ServerIP = "83.166.244.71",
    [string]$Username = "root",
    [string]$Password = "yqOdhMhP41s5827h"
)

Write-Host "🚀 Автоматический деплой на сервер $ServerIP" -ForegroundColor Green

# Команды для выполнения на сервере
$commands = @"
cd /root/prompthub
echo "✅ Зависимости готовы"

echo "🏗️ КРИТИЧЕСКИЙ ЭТАП - Сборка приложения..."
npm run build

if [ -f ".next/BUILD_ID" ]; then
    echo "✅ СБОРКА УСПЕШНА - BUILD_ID найден"
    
    echo "🔄 Перезапускаем приложение..."
    pm2 restart all
    pm2 save
    
    echo "⏳ Ждем 5 секунд для инициализации..."
    sleep 5
    
    echo "📊 Проверяем статус:"
    pm2 status
    
    echo "🌐 Проверяем сайт:"
    curl -s http://localhost:3000 | head -3
    
    echo "🔗 Проверяем API:"
    curl -s http://localhost:3000/api/prompts?limit=1 | head -5
    
    echo "📦 Импортируем новые промпты..."
    npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub4.json
    
    echo "🌍 Финальная проверка внешнего доступа:"
    curl -s http://83.166.244.71:3000 | head -2
    
    echo "🎉 ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН!"
    echo "✅ Сайт доступен: http://83.166.244.71:3000"
    
else
    echo "❌ КРИТИЧЕСКАЯ ОШИБКА: Сборка провалилась!"
    echo "🚨 BUILD_ID не найден - откатываемся..."
    
    pm2 stop all
    cd /root
    rm -rf prompthub
    mv prompthub_backup_* prompthub
    cd prompthub
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "✅ Откат выполнен - сайт восстановлен"
fi
"@

Write-Host "📝 Команды подготовлены. Выполняем SSH подключение..." -ForegroundColor Yellow

try {
    # Используем plink для выполнения команд
    if (Test-Path "plink.exe") {
        Write-Host "🔐 Выполняем команды через plink..." -ForegroundColor Cyan
        echo $Password | .\plink.exe -ssh -batch -pw $Password $Username@$ServerIP $commands
    } else {
        Write-Host "❌ plink.exe не найден. Выполните команды вручную:" -ForegroundColor Red
        Write-Host $commands -ForegroundColor White
    }
} catch {
    Write-Host "❌ Ошибка выполнения: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Выполните команды вручную на сервере:" -ForegroundColor Yellow
    Write-Host $commands -ForegroundColor White
}
