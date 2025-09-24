// Ручной деплой с проверками
console.log('🚀 РУЧНОЙ ДЕПЛОЙ НА СЕРВЕР');
console.log('========================\n');

const steps = [
  {
    number: 1,
    name: 'Обновление кода',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && git fetch origin && git reset --hard origin/main"',
    description: 'Получаем последние изменения из репозитория'
  },
  {
    number: 2,
    name: 'Установка зависимостей',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npm install"',
    description: 'Устанавливаем зависимости'
  },
  {
    number: 3,
    name: 'Обновление Prisma',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npx prisma generate"',
    description: 'Генерируем Prisma клиент'
  },
  {
    number: 4,
    name: 'Обновление базы данных',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npx prisma db push --accept-data-loss"',
    description: 'Обновляем схему базы данных'
  },
  {
    number: 5,
    name: 'Импорт промптов',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json"',
    description: 'Импортируем новые промпты'
  },
  {
    number: 6,
    name: 'Сборка приложения',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npm run build"',
    description: 'Собираем приложение для продакшна'
  },
  {
    number: 7,
    name: 'Перезапуск приложения',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && pm2 stop prompthub && pm2 delete prompthub && pm2 start ecosystem.config.js"',
    description: 'Перезапускаем приложение'
  },
  {
    number: 8,
    name: 'Сохранение конфигурации',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && pm2 save"',
    description: 'Сохраняем конфигурацию PM2'
  }
];

console.log('📋 ВЫПОЛНИТЕ КОМАНДЫ ПО ОДНОЙ:');
console.log('==============================\n');

steps.forEach(step => {
  console.log(`ШАГ ${step.number}: ${step.name}`);
  console.log(`Описание: ${step.description}`);
  console.log(`Команда: ${step.command}`);
  console.log('---\n');
});

console.log('🔍 ПРОВЕРКА РЕЗУЛЬТАТА:');
console.log('curl http://83.166.244.71:3000/api/prompts?limit=10');
console.log('ssh root@83.166.244.71 "pm2 status"');

console.log('\n⚠️  ВАЖНО:');
console.log('• Выполняйте команды по одной');
console.log('• Проверяйте результат каждого шага');
console.log('• При ошибке остановитесь и разберитесь');
console.log('• Пароль для SSH: yqOdhMhP41s5827h');

console.log('\n✅ ГОТОВ К ВЫПОЛНЕНИЮ!');
