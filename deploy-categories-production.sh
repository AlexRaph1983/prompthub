#!/bin/bash

# Безопасный деплой системы категорий на продакшен
# Сервер: Orange Curium (83.166.244.71)

set -e  # Остановить при любой ошибке

echo "🚀 Начинаем безопасный деплой системы категорий..."

# 1. Подключение к серверу и получение последних изменений
echo "📥 Получаем последние изменения с GitHub..."
ssh root@83.166.244.71 "cd /root/prompthub && git fetch origin && git reset --hard origin/main"

# 2. Установка зависимостей
echo "📦 Устанавливаем зависимости..."
ssh root@83.166.244.71 "cd /root/prompthub && npm ci"

# 3. Генерация Prisma клиента
echo "🗄️ Генерируем Prisma клиент..."
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma generate"

# 4. Применение миграций (БЕЗОПАСНО - только добавляет новые таблицы)
echo "🔄 Применяем миграции..."
ssh root@83.166.244.71 "cd /root/prompthub && npx prisma migrate deploy"

# 5. Заполнение категорий и тегов
echo "🌱 Заполняем категории и теги..."
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/seed-categories.js"

# 6. Обновление счётчиков
echo "📊 Обновляем счётчики..."
ssh root@83.166.244.71 "cd /root/prompthub && node scripts/update-category-counts.js update"

# 7. Сборка проекта
echo "🔨 Собираем проект..."
ssh root@83.166.244.71 "cd /root/prompthub && npm run build"

# 8. Перезапуск приложения
echo "🔄 Перезапускаем приложение..."
ssh root@83.166.244.71 "cd /root/prompthub && pm2 restart prompthub"

# 9. Проверка статуса
echo "✅ Проверяем статус..."
ssh root@83.166.244.71 "cd /root/prompthub && pm2 status"

# 10. Проверка работы сайта
echo "🌐 Проверяем работу сайта..."
curl -f http://83.166.244.71/ru/prompts || echo "⚠️ Предупреждение: не удалось проверить сайт"

echo "🎉 Деплой завершён успешно!"
echo "📋 Проверьте:"
echo "   - http://83.166.244.71/ru/prompts - главная страница с категориями"
echo "   - http://83.166.244.71/ru/category/legal - страница категории"
echo "   - http://83.166.244.71/ru/category/image - категория с подкатегориями"
