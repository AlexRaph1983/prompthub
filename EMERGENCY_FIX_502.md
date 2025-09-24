# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ 502 ОШИБКИ

## ❌ Проблема
502 Bad Gateway - приложение не работает

## ✅ БЫСТРОЕ РЕШЕНИЕ

### 1. Подключитесь к серверу
```bash
ssh root@83.166.244.71
# Пароль: yqOdhMhP41s5827h
```

### 2. Проверьте статус приложения
```bash
pm2 status
```

### 3. Если приложение не запущено - запустите
```bash
cd /root/prompthub
pm2 start ecosystem.config.js
```

### 4. Если приложение запущено, но не работает - перезапустите
```bash
pm2 restart prompthub
```

### 5. Проверьте логи
```bash
pm2 logs prompthub --lines 20
```

### 6. Если есть ошибки - пересоберите
```bash
cd /root/prompthub
npm run build
pm2 restart prompthub
```

### 7. Проверьте результат
```bash
curl http://localhost:3000
```

## 🎯 Ожидаемый результат
- Статус: online
- Сайт: http://83.166.244.71:3000 работает
- API: http://83.166.244.71:3000/api/prompts работает

## 🆘 Если не помогает
```bash
pm2 stop prompthub
pm2 delete prompthub
pm2 start npm --name "prompthub" -- start
pm2 save
```

**ВЫПОЛНИТЕ ЭТИ КОМАНДЫ СЕЙЧАС!**
