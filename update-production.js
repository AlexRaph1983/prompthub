/**
 * Простое обновление продакшена
 */

const { exec } = require('child_process');

console.log('🚀 ОБНОВЛЕНИЕ ПРОДАКШЕНА');
console.log('======================');

// Команды для выполнения на сервере
const commands = [
  'cd /root/prompthub',
  'git fetch origin',
  'git reset --hard origin/main',
  'pm2 restart all'
];

console.log('📋 Команды для выполнения на сервере:');
commands.forEach((cmd, i) => {
  console.log(`${i + 1}. ${cmd}`);
});

console.log('\n🔧 Выполните эти команды на сервере:');
console.log('ssh root@83.166.244.71');
console.log('(пароль: yqOdhMhP41s5827h)');
console.log('\nЗатем выполните команды выше по порядку.');

console.log('\n⏳ После обновления подождите 30 секунд и проверьте:');
console.log('node scripts/check-after-restart.js');
