# 🔧 CI/CD РЕКОМЕНДАЦИИ - PromptHub

## 🎯 **Цель**: Предотвращение регрессов и автоматизация деплоя

### **Проблема**: Отсутствие CI/CD привело к поломке в production

## 🚀 **GitHub Actions Workflow**

### **1. Создать `.github/workflows/ci.yml`**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 10.17.0
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Generate Prisma Client
      run: npx prisma generate
    
    - name: Type check
      run: pnpm type-check
    
    - name: Lint
      run: pnpm lint
    
    - name: Run tests
      run: pnpm test
    
    - name: Build application
      run: pnpm build
    
    - name: E2E tests
      run: pnpm test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_USER }}
        password: ${{ secrets.PROD_PASSWORD }}
        script: |
          cd /root/prompthub
          git fetch origin
          git reset --hard origin/main
          bash scripts/deploy.sh
```

### **2. Создать `.github/workflows/health-check.yml`**
```yaml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *'  # Каждые 5 минут
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Check site health
      run: |
        response=$(curl -s -o /dev/null -w "%{http_code}" https://prompt-hub.site)
        if [ $response != "200" ]; then
          echo "Site is down! HTTP: $response"
          exit 1
        fi
        echo "Site is healthy: $response"
    
    - name: Notify on failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: '🚨 PromptHub is DOWN!'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 🛡️ **Branch Protection Rules**

### **Настройка в GitHub Settings > Branches**
```yaml
Branch: main
Protection rules:
✅ Require a pull request before merging
✅ Require status checks to pass before merging
  - CI/CD Pipeline / test (ubuntu-latest, 18.x)
  - CI/CD Pipeline / test (ubuntu-latest, 20.x)
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Restrict pushes that create files
✅ Do not allow bypassing the above settings
```

## 🔧 **Pre-commit Hooks**

### **Установка Husky**
```bash
# В package.json добавить:
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  }
}

# Создать .husky/pre-commit:
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

### **Конфигурация lint-staged**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "tsc --noEmit"
    ],
    "*.{js,jsx,ts,tsx,md,json}": [
      "prettier --write"
    ]
  }
}
```

## 📊 **Quality Gates**

### **1. TypeScript строгость**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### **2. ESLint правила**
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error"
  }
}
```

### **3. Prisma проверки**
```bash
# Добавить в CI:
- name: Check Prisma schema
  run: npx prisma validate

- name: Check migrations
  run: npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

## 🚀 **Deployment Strategy**

### **1. Blue-Green Deployment**
```bash
# scripts/blue-green-deploy.sh
#!/bin/bash
set -euo pipefail

BLUE_PORT=3000
GREEN_PORT=3001
HEALTH_ENDPOINT="http://localhost"

# Определить активный порт
if curl -f $HEALTH_ENDPOINT:$BLUE_PORT/api/health; then
  ACTIVE_PORT=$BLUE_PORT
  STANDBY_PORT=$GREEN_PORT
else
  ACTIVE_PORT=$GREEN_PORT
  STANDBY_PORT=$BLUE_PORT
fi

echo "Active: $ACTIVE_PORT, Deploying to: $STANDBY_PORT"

# Деплой на standby
pm2 stop prompthub-standby || true
PORT=$STANDBY_PORT pm2 start npm --name prompthub-standby -- start

# Health check
sleep 30
if curl -f $HEALTH_ENDPOINT:$STANDBY_PORT/api/health; then
  echo "Standby healthy, switching traffic..."
  
  # Switch nginx upstream
  sed -i "s/localhost:$ACTIVE_PORT/localhost:$STANDBY_PORT/" /etc/nginx/sites-available/prompthub
  nginx -s reload
  
  # Stop old version
  pm2 stop prompthub-active || true
  pm2 delete prompthub-active || true
  
  # Rename processes
  pm2 delete prompthub-standby
  PORT=$STANDBY_PORT pm2 start npm --name prompthub-active -- start
  
  echo "Deployment successful!"
else
  echo "Standby failed health check, rolling back..."
  pm2 stop prompthub-standby
  exit 1
fi
```

### **2. Rollback Strategy**
```bash
# scripts/rollback.sh
#!/bin/bash
set -euo pipefail

ROLLBACK_COMMIT=${1:-HEAD~1}

echo "Rolling back to: $ROLLBACK_COMMIT"

# Create rollback branch
git checkout -b rollback/$(date +%Y%m%d-%H%M%S)
git reset --hard $ROLLBACK_COMMIT

# Deploy rollback
bash scripts/deploy.sh

echo "Rollback complete to: $ROLLBACK_COMMIT"
```

## 📈 **Monitoring & Alerting**

### **1. Health Endpoint**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    
    // Redis check (if used)
    // await redis.ping()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
```

### **2. PM2 Monitoring**
```bash
# Установить PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:compress true

# Настроить алерты
pm2 install pm2-slack
pm2 set pm2-slack:slack_url https://hooks.slack.com/your-webhook
```

## 🔒 **Security & Secrets**

### **GitHub Secrets**
```bash
PROD_HOST=83.166.244.71
PROD_USER=root
PROD_PASSWORD=*** (зашифровано)
SLACK_WEBHOOK=*** (зашифровано)
DATABASE_URL=*** (зашифровано)
NEXTAUTH_SECRET=*** (зашифровано)
```

### **Environment Validation**
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXTAUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  ADMIN_API_KEY: z.string().min(32).optional()
})

export const env = envSchema.parse(process.env)
```

## 📋 **Checklist Implementation**

### **Немедленно (после восстановления):**
- [ ] Создать `.github/workflows/ci.yml`
- [ ] Настроить branch protection для `main`
- [ ] Добавить health endpoint
- [ ] Установить Husky pre-commit hooks

### **В течение недели:**
- [ ] Настроить monitoring и алерты
- [ ] Реализовать blue-green deployment
- [ ] Добавить автоматические тесты
- [ ] Создать rollback процедуру

### **Долгосрочно:**
- [ ] Настроить staging environment
- [ ] Добавить performance monitoring
- [ ] Реализовать feature flags
- [ ] Автоматизировать security scanning

---

**Результат**: Полная автоматизация CI/CD с предотвращением регрессов как в коммите 008c811.
