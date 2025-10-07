#!/bin/bash

# Безопасный деплой системы категорий
echo "🚀 ДЕПЛОЙ СИСТЕМЫ КАТЕГОРИЙ"
echo "========================="

# 1. Получение изменений
echo ""
echo "1️⃣ Получение изменений с GitHub..."
ssh root@83.166.244.71 "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

# 2. Установка зависимостей
echo ""
echo "2️⃣ Установка зависимостей..."
ssh root@83.166.244.71 "cd /root/prompthub && npm ci"

# 3. Генерация Prisma
echo ""
echo "3️⃣ Генерация Prisma клиента..."
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma generate"

# 4. Миграции
echo ""
echo "4️⃣ Применение миграций..."
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma migrate deploy"

# 5. Заполнение данных
echo ""
echo "5️⃣ Заполнение категорий..."
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/seed-categories.js"

# 6. Обновление счётчиков
echo ""
echo "6️⃣ Обновление счётчиков..."
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/update-category-counts.js update"

# 7. Сборка
echo ""
echo "7️⃣ Сборка проекта..."
ssh root@83.166.244.71 "cd /root/prompthub && npm run build"

# 8. Перезапуск
echo ""
echo "8️⃣ Перезапуск приложения..."
ssh root@83.166.244.71 "cd /root/prompthub && pm2 restart prompthub"

# 9. Проверка
echo ""
echo "9️⃣ Проверка статуса..."
ssh root@83.166.244.71 "cd /root/prompthub && pm2 status"

echo ""
echo "🎉 ДЕПЛОЙ ЗАВЕРШЁН!"
echo ""
echo "📋 Проверьте:"
echo "   http://83.166.244.71/ru/prompts"
echo "   http://83.166.244.71/ru/category/legal"
echo "   http://83.166.244.71/ru/category/image"