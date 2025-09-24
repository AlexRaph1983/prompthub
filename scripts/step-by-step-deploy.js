// Пошаговый деплой с проверками
console.log('🚀 ПОШАГОВЫЙ ДЕПЛОЙ НА СЕРВЕР');
console.log('============================\n');

const steps = [
  {
    number: 1,
    name: 'Обновление кода',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && git fetch origin && git reset --hard origin/main"',
    check: 'Проверить, что код обновился'
  },
  {
    number: 2,
    name: 'Установка зависимостей',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npm install"',
    check: 'Проверить, что зависимости установлены'
  },
  {
    number: 3,
    name: 'Обновление Prisma',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npx prisma generate"',
    check: 'Проверить, что Prisma клиент обновлен'
  },
  {
    number: 4,
    name: 'Обновление базы данных',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npx prisma db push --accept-data-loss"',
    check: 'Проверить, что база данных обновлена'
  },
  {
    number: 5,
    name: 'Импорт промптов',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json"',
    check: 'Проверить, что промпты импортированы'
  },
  {
    number: 6,
    name: 'Сборка приложения',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && npm run build"',
    check: 'Проверить, что приложение собрано'
  },
  {
    number: 7,
    name: 'Перезапуск приложения',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && pm2 stop prompthub || true && pm2 delete prompthub || true && pm2 start ecosystem.config.js || pm2 start npm --name \'prompthub\' -- start"',
    check: 'Проверить, что приложение запущено'
  },
  {
    number: 8,
    name: 'Сохранение конфигурации',
    command: 'ssh root@83.166.244.71 "cd /root/prompthub && pm2 save"',
    check: 'Проверить, что конфигурация сохранена'
  }
];

console.log('📋 ИНСТРУКЦИЯ ПО ВЫПОЛНЕНИЮ:');
console.log('============================\n');

steps.forEach(step => {
  console.log(`ШАГ ${step.number}: ${step.name}`);
  console.log(`Команда: ${step.command}`);
  console.log(`Проверка: ${step.check}`);
  console.log('---\n');
});

console.log('🔍 ФИНАЛЬНАЯ ПРОВЕРКА:');
console.log('curl http://83.166.244.71:3000/api/prompts?limit=10');
console.log('ssh root@83.166.244.71 "pm2 status"');
console.log('ssh root@83.166.244.71 "pm2 logs prompthub --lines 10"');

console.log('\n⚠️  ВАЖНО:');
console.log('• Выполняйте команды по одной');
console.log('• Проверяйте результат каждого шага');
console.log('• При ошибке остановитесь и разберитесь');
console.log('• Пароль для SSH: yqOdhMhP41s5827h');

console.log('\n✅ ГОТОВ К ВЫПОЛНЕНИЮ!');
