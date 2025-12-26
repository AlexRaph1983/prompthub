#!/bin/bash
set -euo pipefail

# Деплой без миграций/сидов (как указано в правилах)
echo "=== Step 1: Deploy code ==="
cd /root/prompthub
git fetch origin
git reset --hard origin/main
bash scripts/deploy.sh

# Ждём, пока приложение перезапустится
echo "=== Step 2: Waiting for app restart ==="
sleep 5

# Импорт промптов (безопасный, батчами)
echo "=== Step 3: Import 300 prompts ==="
node scripts/import-prompts-from-file-safe.js \
  --file=data/generated_prompts_ru_300.json \
  --authorEmail=content-architect@prompthub.local \
  --dryRun=false \
  --batch=25

# Проверка результата
echo "=== Step 4: Verify import ==="
node scripts/verify-import.js --authorEmail=content-architect@prompthub.local

echo "=== Deployment and import complete ==="

