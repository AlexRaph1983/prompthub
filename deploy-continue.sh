#!/bin/bash
set -e

cd /root/prompthub

echo "=== Checking PM2 status ==="
/root/.local/share/pnpm/pm2 list || echo "PM2 not found, checking process..."
ps aux | grep -i next | head -5

echo ""
echo "=== Deleting old content-architect prompts ==="
node scripts/delete-content-architect-prompts.js

echo ""
echo "=== Importing 300 new prompts ==="
node scripts/import-prompts-from-file-safe.js \
  --file=data/generated_prompts_ru_300.json \
  --authorEmail=content-architect@prompthub.local \
  --dryRun=false \
  --batch=25

echo ""
echo "=== Verifying import ==="
node scripts/verify-import.js --authorEmail=content-architect@prompthub.local

echo ""
echo "=== Checking PM2 logs ==="
/root/.local/share/pnpm/pm2 logs --lines 20 --nostream || tail -50 /root/.pm2/logs/*.log

echo ""
echo "=== DEPLOYMENT COMPLETED ==="



