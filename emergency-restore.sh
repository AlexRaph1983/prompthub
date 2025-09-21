#!/bin/bash
set -euo pipefail

echo "🚨 EMERGENCY RESTORE - PromptHub"
echo "=================================="

# Определяем SAFE_POINT
SAFE_POINT="edd5c04"
CURRENT_BRANCH=$(git branch --show-current)

echo "📍 Current branch: $CURRENT_BRANCH"
echo "🎯 Target SAFE_POINT: $SAFE_POINT"

# Создаем hotfix ветку
echo "🔧 Creating hotfix branch..."
git stash push -m "Emergency restore stash" || true
git checkout -b hotfix/restore-stable || git checkout hotfix/restore-stable

# Откатываемся к стабильному состоянию
echo "⏪ Reverting to SAFE_POINT..."
git reset --hard $SAFE_POINT

# Очищаем и переустанавливаем зависимости
echo "📦 Cleaning and installing dependencies..."
rm -rf node_modules .next
pnpm install --frozen-lockfile

# Генерируем Prisma клиент
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Собираем приложение
echo "🏗️ Building application..."
pnpm build

echo "✅ RESTORE COMPLETE!"
echo "===================="
echo "📋 Next steps:"
echo "1. Test locally: pnpm start"
echo "2. Deploy to production: bash scripts/deploy.sh"
echo "3. Verify site: curl https://prompt-hub.site"

echo ""
echo "📊 Status:"
echo "- Current commit: $(git rev-parse --short HEAD)"
echo "- Branch: $(git branch --show-current)"
echo "- Build status: ✅ Complete"
