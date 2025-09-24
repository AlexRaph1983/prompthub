# 🚨 ИНСТРУКЦИИ ПО ВОССТАНОВЛЕНИЮ САЙТА

## ⚡ БЫСТРОЕ ВОССТАНОВЛЕНИЕ

### 1. Подключитесь к серверу
```bash
ssh root@REDACTED_IP
# Пароль: REDACTED_PASSWORD
```

### 2. Выполните скрипт восстановления
```bash
cd /root/prompthub
bash scripts/emergency-restore.sh
```

## 📋 РУЧНОЕ ВОССТАНОВЛЕНИЕ (если скрипт не работает)

### Шаг 1: Диагностика
```bash
cd /root/prompthub
pm2 status
pm2 logs prompthub --lines 20
```

### Шаг 2: Очистка процессов
```bash
pm2 stop all
pm2 delete all
pkill -f node
```

### Шаг 3: Восстановление приложения
```bash
npm install
npx prisma generate
```

### Шаг 4: Запуск
```bash
pm2 start ecosystem.config.js
# ИЛИ если не работает:
pm2 start npm --name "prompthub" -- start
```

### Шаг 5: Проверка
```bash
pm2 status
curl http://localhost:3000
pm2 save
```

## 🔧 АЛЬТЕРНАТИВНЫЕ ВАРИАНТЫ

### Если приложение падает при запуске:
```bash
npm run build
pm2 restart prompthub
```

### Если проблемы с базой данных:
```bash
npx prisma db push --accept-data-loss
pm2 restart prompthub
```

### Если нужен откат кода:
```bash
git log --oneline -5
git reset --hard <HASH_ПРЕДЫДУЩЕГО_КОММИТА>
npm install
npm run build
pm2 start npm --name "prompthub" -- start
```

## ✅ КРИТЕРИИ УСПЕШНОГО ВОССТАНОВЛЕНИЯ

1. **PM2 статус**: `pm2 status` показывает "online"
2. **Локальный тест**: `curl http://localhost:3000` возвращает HTML
3. **Внешний доступ**: http://REDACTED_IP:3000 открывается в браузере
4. **API работает**: http://REDACTED_IP:3000/api/prompts возвращает данные

## 🚨 ЕСЛИ НИЧЕГО НЕ ПОМОГАЕТ

### Минимальный запуск:
```bash
cd /root/prompthub
PORT=3000 npm start
```

### Проверка что блокирует порт:
```bash
netstat -tulpn | grep :3000
ps aux | grep node
```

### Полная переустановка:
```bash
rm -rf node_modules
npm install
npm run build
pm2 start npm --name "prompthub" -- start
```

**РАБОТАЙТЕ ПО ИНСТРУКЦИИ ДО ПОЛНОГО ВОССТАНОВЛЕНИЯ!**
