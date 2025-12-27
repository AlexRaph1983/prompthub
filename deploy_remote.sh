#!/bin/bash

echo "🚀 Начинаем деплой на продакшен сервер Orange Curium"

cd /root/prompthub || exit 1

echo "📡 Выполняем git fetch origin..."
git fetch origin

echo "🔄 Выполняем git reset --hard origin/main..."
git reset --hard origin/main

echo "🔧 Выполняем bash scripts/deploy.sh..."
bash scripts/deploy.sh

echo "✅ Деплой завершен успешно!"
