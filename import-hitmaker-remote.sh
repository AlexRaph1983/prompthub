#!/bin/bash

echo "🚀 IMPORT HITMAKER PROMPTS TO PRODUCTION"
echo "====================================="

cd /root/prompthub

# Создаем пользователя HitMaker если его нет
echo ""
echo "1. Creating HitMaker user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function createUser() {
  try {
    let user = await prisma.user.findFirst({ where: { name: 'HitMaker' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'hitmaker-user-' + Date.now(),
          name: 'HitMaker',
          email: 'hitmaker@prompts.ai'
        }
      });
      console.log('Created HitMaker user:', user.id);
    } else {
      console.log('Found existing HitMaker user:', user.id);
    }
  } catch (e) {
    console.error('Error creating user:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}
createUser();
"

# Импортируем промпты
echo ""
echo "2. Importing prompts..."
node ../import-hitmaker-production.js

echo ""
echo "3. Updating category counters..."
node scripts/update-category-counts.js update

echo ""
echo "🎉 HITMAKER PROMPTS IMPORT COMPLETED!"
echo "Check at: http://83.166.244.71/ru/prompts"

