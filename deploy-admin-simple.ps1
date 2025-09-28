# Простой деплой админ-панели
$server = "83.166.244.71"
$password = "yqOdhMhP41s5827h"

Write-Host "🚀 Деплой админ-панели..." -ForegroundColor Green

# Создаем bash скрипт
$bashScript = @'
#!/bin/bash
cd /root/prompthub
echo "💾 Backup..."
cp -r /root/prompthub /root/prompthub_backup_$(date +%Y%m%d_%H%M%S)
echo "⏹️ Stop app..."
pm2 stop all
echo "📥 Update code..."
git fetch origin
git reset --hard origin/main
echo "🔧 Install deps..."
rm -rf node_modules package-lock.json
npm install
echo "🗄️ Update DB..."
npx prisma db push
npx prisma generate
echo "🔐 Setup admin..."
echo 'ADMIN_EMAIL=your-email@gmail.com' > .env.local
echo 'ADMIN_API_KEY=admin-secret-key-123' >> .env.local
echo "🏗️ Build..."
npm run build
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build OK!"
    pm2 start all
    pm2 save
    sleep 10
    pm2 status
    echo "🎉 DEPLOY SUCCESS!"
    echo "Site: http://83.166.244.71:3000"
    echo "Admin: http://83.166.244.71:3000/admin"
else
    echo "❌ Build failed! Rolling back..."
    BACKUP=$(ls -td /root/prompthub_backup_* | head -1)
    if [ -n "$BACKUP" ]; then
        rm -rf /root/prompthub
        mv "$BACKUP" /root/prompthub
        cd /root/prompthub
        pm2 start all
        echo "✅ Rollback done"
    fi
fi
'@

# Сохраняем скрипт
$bashScript | Out-File -FilePath "deploy.sh" -Encoding UTF8

Write-Host "📤 Uploading script..." -ForegroundColor Yellow
pscp -pw $password deploy.sh root@${server}:/root/deploy.sh

Write-Host "🔧 Executing on server..." -ForegroundColor Yellow
plink -ssh -pw $password root@$server "chmod +x /root/deploy.sh"
plink -ssh -pw $password root@$server "/root/deploy.sh"
plink -ssh -pw $password root@$server "rm /root/deploy.sh"

Remove-Item deploy.sh -Force
Write-Host "✅ Done! Check: http://83.166.244.71:3000/admin" -ForegroundColor Green
