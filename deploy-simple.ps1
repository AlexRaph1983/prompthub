# Простой безопасный деплой системы категорий
Write-Host "🚀 ДЕПЛОЙ СИСТЕМЫ КАТЕГОРИЙ" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# 1. Получение изменений
Write-Host "`n1️⃣ Получение изменений с GitHub..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

# 2. Установка зависимостей
Write-Host "`n2️⃣ Установка зависимостей..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npm ci"

# 3. Генерация Prisma
Write-Host "`n3️⃣ Генерация Prisma клиента..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma generate"

# 4. Миграции
Write-Host "`n4️⃣ Применение миграций..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma migrate deploy"

# 5. Заполнение данных
Write-Host "`n5️⃣ Заполнение категорий..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/seed-categories.js"

# 6. Обновление счётчиков
Write-Host "`n6️⃣ Обновление счётчиков..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/update-category-counts.js update"

# 7. Сборка
Write-Host "`n7️⃣ Сборка проекта..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npm run build"

# 8. Перезапуск
Write-Host "`n8️⃣ Перезапуск приложения..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && pm2 restart prompthub"

# 9. Проверка
Write-Host "`n9️⃣ Проверка статуса..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && pm2 status"

Write-Host "`n🎉 ДЕПЛОЙ ЗАВЕРШЁН!" -ForegroundColor Green
Write-Host "`n📋 Проверьте:" -ForegroundColor Cyan
Write-Host "   http://83.166.244.71/ru/prompts" -ForegroundColor White
Write-Host "   http://83.166.244.71/ru/category/legal" -ForegroundColor White
Write-Host "   http://83.166.244.71/ru/category/image" -ForegroundColor White
