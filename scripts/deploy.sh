#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-/root/prompthub}"
APP_NAME="${APP_NAME:-prompthub}"
PORT="${PORT:-3000}"
BRANCH="${BRANCH:-main}"
SKIP_BUILD="${SKIP_BUILD:-0}"

cd "${APP_DIR}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Deploying ${APP_NAME} in ${APP_DIR} (branch ${BRANCH})"

if [ ! -d .git ]; then
  log "Repository missing in ${APP_DIR}. Aborting."
  exit 1
fi

log "Fetching latest changes"
git fetch --all --prune
log "Resetting to origin/${BRANCH}"
git reset --hard "origin/${BRANCH}"

if [ ! -x scripts/deploy.sh ]; then
  chmod +x scripts/deploy.sh || true
fi

install_deps() {
  if [ -f package-lock.json ]; then
    if command -v npm >/dev/null 2>&1; then
      log "Installing dependencies via npm ci"
      npm ci --no-audit --no-fund --progress=false || {
        log "npm ci failed, falling back to npm install"
        npm install --no-audit --no-fund --progress=false
      }
      return
    fi
  fi

  if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
    log "Installing dependencies via pnpm install"
    pnpm install --frozen-lockfile --reporter=silent
    return
  fi

  if command -v npm >/dev/null 2>&1; then
    log "Installing dependencies via npm install"
    npm install --no-audit --no-fund --progress=false
    return
  fi

  log "No supported package manager found"
  exit 1
}

install_deps

log "Running database migrations"
npx prisma migrate deploy

log "Generating Prisma client"
npx prisma generate

log "Cleaning previous build artifacts"
rm -rf .next

if [ "${SKIP_BUILD}" != "1" ]; then
  log "Building application"
  npm run build
else
  log "Skipping build step by request"
fi

if [ ! -f ecosystem.config.js ]; then
  log "Creating default PM2 ecosystem configuration"
  cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    cwd: '${APP_DIR}',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p ${PORT}',
    env: { NODE_ENV: 'production' },
    autorestart: true,
    max_restarts: 10
  }]
};
EOF
fi

log "Reloading application via PM2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload "${APP_NAME}" --update-env || pm2 restart "${APP_NAME}"
else
  pm2 start ecosystem.config.js --only "${APP_NAME}"
fi
pm2 save

log "Deployment complete"
