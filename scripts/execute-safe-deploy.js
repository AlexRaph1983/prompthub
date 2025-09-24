// Безопасный деплой с проверками
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 НАЧИНАЕМ БЕЗОПАСНЫЙ ДЕПЛОЙ НА СЕРВЕР');
console.log('=====================================\n');

// Команды для выполнения на сервере
const deployCommands = [
  {
    step: '1. Обновление кода',
    command: 'cd /root/prompthub && git fetch origin && git reset --hard origin/main',
    description: 'Получаем последние изменения из репозитория'
  },
  {
    step: '2. Установка зависимостей',
    command: 'cd /root/prompthub && npm install',
    description: 'Устанавливаем зависимости'
  },
  {
    step: '3. Обновление Prisma',
    command: 'cd /root/prompthub && npx prisma generate',
    description: 'Генерируем Prisma клиент'
  },
  {
    step: '4. Обновление базы данных',
    command: 'cd /root/prompthub && npx prisma db push --accept-data-loss',
    description: 'Обновляем схему базы данных'
  },
  {
    step: '5. Импорт промптов',
    command: 'cd /root/prompthub && npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json',
    description: 'Импортируем новые промпты'
  },
  {
    step: '6. Сборка приложения',
    command: 'cd /root/prompthub && npm run build',
    description: 'Собираем приложение для продакшна'
  },
  {
    step: '7. Перезапуск приложения',
    command: 'cd /root/prompthub && pm2 stop prompthub || true && pm2 delete prompthub || true && pm2 start ecosystem.config.js || pm2 start npm --name "prompthub" -- start',
    description: 'Перезапускаем приложение'
  },
  {
    step: '8. Сохранение конфигурации PM2',
    command: 'cd /root/prompthub && pm2 save',
    description: 'Сохраняем конфигурацию PM2'
  }
];

console.log('📋 ПЛАН ВЫПОЛНЕНИЯ:');
deployCommands.forEach((cmd, index) => {
  console.log(`${cmd.step}: ${cmd.description}`);
});

console.log('\n⚠️  ВНИМАНИЕ: Эти команды будут выполнены на сервере 83.166.244.71');
console.log('🔐 Для выполнения нужен SSH доступ к серверу');
console.log('\n📝 Команды для выполнения:');

deployCommands.forEach((cmd, index) => {
  console.log(`\n${cmd.step}:`);
  console.log(`ssh root@83.166.244.71 "${cmd.command}"`);
});

console.log('\n🔍 ПРОВЕРКА РЕЗУЛЬТАТА:');
console.log('curl http://83.166.244.71:3000/api/prompts?limit=10');
console.log('pm2 status');
console.log('pm2 logs prompthub --lines 20');

console.log('\n✅ ГОТОВ К ВЫПОЛНЕНИЮ БЕЗОПАСНОГО ДЕПЛОЯ!');
