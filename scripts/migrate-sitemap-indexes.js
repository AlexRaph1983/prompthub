#!/usr/bin/env node

/**
 * Скрипт для применения миграции индексов Prisma для sitemap
 * Запуск: node scripts/migrate-sitemap-indexes.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Применение миграции индексов для sitemap...');

try {
  // Проверяем, что мы в корне проекта
  if (!fs.existsSync('prisma/schema.prisma')) {
    throw new Error('Не найден prisma/schema.prisma. Запустите скрипт из корня проекта.');
  }

  // Генерируем миграцию
  console.log('📝 Генерация миграции...');
  execSync('npx prisma migrate dev --name add-sitemap-indexes', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Генерируем Prisma Client
  console.log('🔧 Генерация Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Миграция успешно применена!');
  console.log('');
  console.log('📋 Добавленные индексы:');
  console.log('  - @@index([category]) - для быстрого поиска по категориям');
  console.log('  - @@index([updatedAt]) - для сортировки по дате обновления');
  console.log('  - @@index([category, updatedAt]) - составной индекс для категорий');
  console.log('');
  console.log('🎯 Теперь sitemap будет генерироваться быстрее!');

} catch (error) {
  console.error('❌ Ошибка при применении миграции:', error.message);
  process.exit(1);
}
