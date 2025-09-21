#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-/root/prompthub}"
APP_NAME="${APP_NAME:-prompthub}"
PORT="${PORT:-3000}"
BRANCH="${BRANCH:-main}"
SKIP_BUILD="${SKIP_BUILD:-0}"
RUN_DB_MIGRATIONS="${RUN_DB_MIGRATIONS:-0}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-1}"

cd "${APP_DIR}"

# Load environment variables from .env.production if present (without overriding already-exported ones)
if [ -f .env.production ]; then
  # Export variables from .env.production safely
  set -a
  # shellcheck disable=SC1091
  . ./.env.production
  set +a
fi

# Ensure NEXTAUTH_SECRET exists in production; generate if missing
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  NEXTAUTH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '\n')
  export NEXTAUTH_SECRET
fi

# If IMPERSONATION_SECRET not set, align it with NEXTAUTH_SECRET (same crypto base)
if [ -z "${IMPERSONATION_SECRET:-}" ]; then
  IMPERSONATION_SECRET="$NEXTAUTH_SECRET"
  export IMPERSONATION_SECRET
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Deploying ${APP_NAME} in ${APP_DIR} (branch ${BRANCH})"

if [ ! -d .git ]; then
  log "Repository missing in ${APP_DIR}. Aborting."
  exit 1
fi

if [ "${BACKUP_BEFORE_DEPLOY}" = "1" ]; then
  log "Creating code snapshot before deploy"
  SNAP_DIR="/root/backup_prompthub_$(date '+%Y%m%d-%H%M%S')"
  mkdir -p "$SNAP_DIR"
  tar -czf "$SNAP_DIR/code.tgz" . || true
  if [ -f prisma/dev.db ]; then
    cp prisma/dev.db "$SNAP_DIR/dev.db" || true
  fi
  log "Snapshot saved at $SNAP_DIR"
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

if [ "${RUN_DB_MIGRATIONS}" = "1" ]; then
  log "Running database migrations (RUN_DB_MIGRATIONS=1)"
  npx prisma migrate deploy
else
  log "Skipping database migrations (RUN_DB_MIGRATIONS=0)"
fi

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

# Always (re)create PM2 ecosystem config with required env for NextAuth/Google OAuth
log "Writing PM2 ecosystem configuration with environment"
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    cwd: '${APP_DIR}',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p ${PORT}',
    env: {
      NODE_ENV: 'production',
      PORT: '${PORT}',
      NEXTAUTH_URL: '${NEXTAUTH_URL:-}',
      NEXTAUTH_SECRET: '${NEXTAUTH_SECRET}',
      IMPERSONATION_SECRET: '${IMPERSONATION_SECRET}',
      GOOGLE_CLIENT_ID: '${GOOGLE_CLIENT_ID:-}',
      GOOGLE_CLIENT_SECRET: '${GOOGLE_CLIENT_SECRET:-}'
    },
    autorestart: true,
    max_restarts: 10
  }]
};
EOF

log "Reloading application via PM2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload "${APP_NAME}" --update-env || pm2 restart "${APP_NAME}"
else
  pm2 start ecosystem.config.js --only "${APP_NAME}"
fi
pm2 save

log "Deployment complete"
