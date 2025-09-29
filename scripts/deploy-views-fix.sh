#!/bin/bash

echo "🚀 ДЕПЛОЙ ИСПРАВЛЕНИЯ ПРОСМОТРОВ"
echo "================================"

# Переходим в директорию проекта
cd /root/prompthub

# Получаем последние изменения
echo "📥 Получаем последние изменения..."
git fetch origin
git reset --hard origin/main

# Проверяем статус
echo "📊 Статус git:"
git status

# Запускаем деплой
echo "🚀 Запускаем деплой..."
bash scripts/deploy.sh

echo "✅ Деплой завершен!"
