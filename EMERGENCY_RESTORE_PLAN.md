# 🚨 ПЛАН ЭКСТРЕННОГО ВОССТАНОВЛЕНИЯ САЙТА

## 📊 АНАЛИЗ СИТУАЦИИ
- ❌ Сайт показывает 502 Bad Gateway
- ✅ Сервер доступен по SSH (83.166.244.71:22)
- ❌ Приложение Node.js не работает
- 🔍 Причина: Неудачный деплой привел к падению приложения

## 🚀 ПЛАН ВОССТАНОВЛЕНИЯ (5 ЭТАПОВ)

### ЭТАП 1: ДИАГНОСТИКА
```bash
ssh root@83.166.244.71
cd /root/prompthub
pm2 status
pm2 logs prompthub --lines 20
```

### ЭТАП 2: ОСТАНОВКА СЛОМАННЫХ ПРОЦЕССОВ
```bash
pm2 stop all
pm2 delete all
pkill -f node
```

### ЭТАП 3: БЫСТРОЕ ВОССТАНОВЛЕНИЕ
```bash
cd /root/prompthub
git status
git reset --hard HEAD~1  # Откат к предыдущему коммиту если нужно
npm install
```

### ЭТАП 4: ЗАПУСК ПРИЛОЖЕНИЯ
```bash
# Вариант 1: Через ecosystem
pm2 start ecosystem.config.js

# Вариант 2: Прямой запуск если ecosystem не работает
pm2 start npm --name "prompthub" -- start

# Вариант 3: Простой запуск на порту 3000
pm2 start "npm start" --name prompthub
```

### ЭТАП 5: ПРОВЕРКА И ФИКСАЦИЯ
```bash
pm2 status
pm2 save
curl http://localhost:3000
pm2 logs prompthub --lines 10
```

## 🔧 АЛЬТЕРНАТИВНЫЕ ВАРИАНТЫ

### Если приложение не запускается:
```bash
cd /root/prompthub
npm run build
pm2 start npm --name "prompthub" -- start
```

### Если есть ошибки с базой данных:
```bash
npx prisma generate
npx prisma db push --accept-data-loss
```

### Если нужен полный откат:
```bash
git log --oneline -5
git reset --hard <HASH_РАБОЧЕГО_КОММИТА>
npm install
npm run build
pm2 restart prompthub
```

## ✅ КРИТЕРИИ УСПЕХА
- ✅ `pm2 status` показывает "online"
- ✅ `curl http://localhost:3000` возвращает HTML
- ✅ Сайт доступен по http://83.166.244.71:3000
- ✅ API работает: http://83.166.244.71:3000/api/prompts

## 🚨 ЭКСТРЕННЫЕ КОМАНДЫ
```bash
# Если ничего не помогает - минимальный запуск
cd /root/prompthub
PORT=3000 npm start &

# Проверка процессов
ps aux | grep node
netstat -tulpn | grep :3000
```

**ВЫПОЛНЯЙТЕ КОМАНДЫ ПО ПОРЯДКУ ДО ВОССТАНОВЛЕНИЯ САЙТА!**
