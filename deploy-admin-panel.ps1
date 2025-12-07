# Автоматический деплой админ-панели на сервер
$server = "YOUR_SERVER_IP_HERE"
$password = "YOUR_PASSWORD_HERE"

Write-Host "🚀 Начинаем деплой админ-панели..." -ForegroundColor Green

# Создаем временный скрипт для выполнения на сервере
$deployScript = @"
#!/bin/bash
cd /root/prompthub

echo "💾 Создаем бэкап..."
cp -r /root/prompthub /root/prompthub_backup_`$(date +%Y%m%d_%H%M%S)

echo "⏹️ Останавливаем приложение..."
pm2 stop all

echo "📥 Обновляем код..."
git fetch origin
git reset --hard origin/main

echo "🔧 Исправляем зависимости..."
rm -rf node_modules package-lock.json
npm install

echo "🗄️ Обновляем базу данных..."
npx prisma db push
npx prisma generate

echo "🔐 Настраиваем админский доступ..."
cat > .env.local << 'EOF'
ADMIN_EMAIL=your-email@gmail.com
ADMIN_API_KEY=admin-secret-key-123
EOF

echo "🏗️ Собираем приложение..."
npm run build

if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Сборка успешна!"
    
    echo "🚀 Запускаем приложение..."
    pm2 start all
    pm2 save
    
    sleep 10
    
    echo "📊 Проверяем статус:"
    pm2 status
    
    echo "🌐 Проверяем сайт:"
    curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000
    echo ""
    
    echo "🎉 ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
    echo "✅ Сайт: http://YOUR_SERVER_IP_HERE:3000"
    echo "✅ Админ-панель: http://YOUR_SERVER_IP_HERE:3000/admin"
else
    echo "❌ Сборка провалилась! Откатываемся..."
    LATEST_BACKUP=`$(ls -td /root/prompthub_backup_* | head -1)
    if [ -n "`$LATEST_BACKUP" ]; then
        rm -rf /root/prompthub
        mv "`$LATEST_BACKUP" /root/prompthub
        cd /root/prompthub
        pm2 start all
        echo "✅ Откат завершен"
    fi
fi
"@

# Сохраняем скрипт во временный файл
$deployScript | Out-File -FilePath "temp_deploy.sh" -Encoding UTF8

# Копируем скрипт на сервер и выполняем
Write-Host "📤 Копируем скрипт на сервер..." -ForegroundColor Yellow
& pscp -pw $password temp_deploy.sh root@${server}:/root/temp_deploy.sh

Write-Host "🔧 Выполняем деплой на сервере..." -ForegroundColor Yellow
& plink -ssh -pw $password root@$server "chmod +x /root/temp_deploy.sh && /root/temp_deploy.sh && rm /root/temp_deploy.sh"

# Удаляем временный файл
Remove-Item temp_deploy.sh -Force

Write-Host "✅ Деплой завершен!" -ForegroundColor Green
Write-Host "🌐 Проверьте: http://YOUR_SERVER_IP_HERE:3000/admin" -ForegroundColor Cyan
