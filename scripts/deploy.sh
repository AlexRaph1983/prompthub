#!/bin/bash
set -euo pipefail

APP_DIR="/root/prompthub"
APP_NAME="prompthub"
PORT=3000

cd "$APP_DIR"

echo "🚀 Deploying $APP_NAME in $APP_DIR"

echo "📦 Installing deps (prefer npm ci)"
if command -v npm >/dev/null 2>&1; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  echo "npm not found" >&2; exit 1
fi

echo "🗄️ Prisma generate"
npx prisma generate || true

echo "🧹 Clean previous build"
rm -rf .next

echo "🔨 Building application"
npm run build

# Ensure PM2 ecosystem with fixed cwd
if [ ! -f ecosystem.config.js ]; then
  cat > ecosystem.config.js <<'EOF'
module.exports = {
  apps: [{
    name: 'prompthub',
    cwd: '/root/prompthub',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    env: { NODE_ENV: 'production' },
    autorestart: true,
    max_restarts: 10
  }]
};
EOF
fi

echo "▶️ Restarting via PM2"
pid=$(pm2 id "$APP_NAME" | tr -d '[] ,') || true
if [ -n "$pid" ]; then
  pm2 reload "$APP_NAME" --update-env || true
else
  pm2 start ecosystem.config.js --only "$APP_NAME"
fi
pm2 save

# Health-check CSS
CSS_FILE=$(ls -1 .next/static/css | head -n1 || true)
if [ -z "$CSS_FILE" ]; then
  echo "❌ No CSS files generated" >&2; exit 1
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/_next/static/css/${CSS_FILE}") || true
if [ "$STATUS" != "200" ]; then
  echo "❌ CSS not served (status $STATUS). Forcing full restart..."
  pm2 delete "$APP_NAME" || true
  pm2 start ecosystem.config.js --only "$APP_NAME"
  pm2 save
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/_next/static/css/${CSS_FILE}") || true
  if [ "$STATUS" != "200" ]; then
    echo "❌ CSS still not accessible (status $STATUS)" >&2
    exit 1
  fi
fi

echo "✅ Deploy succeeded. CSS: /_next/static/css/${CSS_FILE} is accessible."
