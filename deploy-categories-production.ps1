# Безопасный деплой системы категорий на продакшен
# Сервер: Orange Curium (83.166.244.71)

Write-Host "🚀 Начинаем безопасный деплой системы категорий..." -ForegroundColor Green

# 1. Подключение к серверу и получение последних изменений
Write-Host "📥 Получаем последние изменения с GitHub..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

# 2. Установка зависимостей
Write-Host "📦 Устанавливаем зависимости..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npm ci"

# 3. Генерация Prisma клиента
Write-Host "🗄️ Генерируем Prisma клиент..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma generate"

# 4. Применение миграций (БЕЗОПАСНО - только добавляет новые таблицы)
Write-Host "🔄 Применяем миграции..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma migrate deploy"

# 5. Заполнение категорий и тегов
Write-Host "🌱 Заполняем категории и теги..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/seed-categories.js"

# 6. Обновление счётчиков
Write-Host "📊 Обновляем счётчики..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/update-category-counts.js update"

# 7. Сборка проекта
Write-Host "🔨 Собираем проект..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && npm run build"

# 8. Перезапуск приложения
Write-Host "🔄 Перезапускаем приложение..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && pm2 restart prompthub"

# 9. Проверка статуса
Write-Host "✅ Проверяем статус..." -ForegroundColor Yellow
ssh root@83.166.244.71 "cd /root/prompthub && pm2 status"

# 10. Проверка работы сайта
Write-Host "🌐 Проверяем работу сайта..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://83.166.244.71/ru/prompts" -UseBasicParsing
    Write-Host "✅ Сайт работает! Статус: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Предупреждение: не удалось проверить сайт" -ForegroundColor Red
}

Write-Host "🎉 Деплой завершён успешно!" -ForegroundColor Green
Write-Host "📋 Проверьте:" -ForegroundColor Cyan
Write-Host "   - http://83.166.244.71/ru/prompts - главная страница с категориями" -ForegroundColor White
Write-Host "   - http://83.166.244.71/ru/category/legal - страница категории" -ForegroundColor White
Write-Host "   - http://83.166.244.71/ru/category/image - категория с подкатегориями" -ForegroundColor White
