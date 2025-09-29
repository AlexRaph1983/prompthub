# Команды для ручного перезапуска сервера на продакшене

## 1. Подключение к серверу
```bash
ssh root@prompt-hub.site
```

## 2. Переход в директорию проекта
```bash
cd /root/prompthub
```

## 3. Получение последних изменений
```bash
git fetch origin
git reset --hard origin/main
```

## 4. Остановка текущего сервера
```bash
# Остановка PM2 процессов
pm2 stop all
pm2 delete all

# Или если используется другой процесс-менеджер
# pkill -f node
# pkill -f next
```

## 5. Очистка кэшей и пересборка
```bash
# Очистка node_modules и переустановка
rm -rf node_modules
rm -rf .next
npm install

# Или если используется pnpm
# pnpm install
```

## 6. Пересборка проекта
```bash
npm run build
```

## 7. Запуск сервера
```bash
# Запуск через PM2
pm2 start ecosystem.config.js

# Или прямой запуск
# npm start
```

## 8. Проверка статуса
```bash
pm2 status
pm2 logs
```

## 9. Проверка работы API
```bash
curl https://prompt-hub.site/api/health
curl https://prompt-hub.site/api/stats
```

## Альтернативный способ (если PM2 не работает)
```bash
# Остановка всех Node.js процессов
pkill -f node

# Очистка портов
netstat -tulpn | grep :3000
kill -9 <PID>

# Запуск заново
npm start
```

## Проверка логов
```bash
# Логи PM2
pm2 logs

# Логи системы
journalctl -u your-service-name

# Логи Nginx (если используется)
tail -f /var/log/nginx/error.log
```

## Если ничего не помогает - полный перезапуск сервера
```bash
sudo reboot
```

После перезапуска сервера подождите 2-3 минуты и проверьте:
- https://prompt-hub.site/api/health
- https://prompt-hub.site/api/stats
- https://prompt-hub.site/api/prompts/cmftyuu1v00539l6hapwra6su
- https://prompt-hub.site/api/recommendations
