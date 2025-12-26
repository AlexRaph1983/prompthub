#!/bin/bash

echo "🚀 DEPLOY HITMAKER PROMPTS"
echo "========================="

# Update code
echo ""
echo "1. Updating code..."
cd /root/prompthub
git fetch origin
git reset --hard origin/main

# Install dependencies
echo ""
echo "2. Installing dependencies..."
npm ci

# Generate Prisma
echo ""
echo "3. Generating Prisma client..."
npx prisma generate

# Build project
echo ""
echo "4. Building project..."
npm run build

# Restart app
echo ""
echo "5. Restarting application..."
pm2 restart prompthub

# Check status
echo ""
echo "6. Checking status..."
pm2 status

echo ""
echo "DEPLOY HITMAKER PROMPTS COMPLETED!"
echo ""
echo "Check new prompts at:"
echo "   http://83.166.244.71/ru/prompts"

