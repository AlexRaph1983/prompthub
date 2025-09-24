# 🚀 КОМАНДЫ ДЛЯ ДЕПЛОЯ НА ПРОДАКШН

## ⚡ БЫСТРЫЙ ДЕПЛОЙ (КОПИРУЙТЕ ПО БЛОКАМ)

### 🔐 1. ПОДКЛЮЧЕНИЕ К СЕРВЕРУ
```bash
ssh root@83.166.244.71
```
**Пароль**: `yqOdhMhP41s5827h`

---

### 📊 2. ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ
```bash
cd /root/prompthub && echo "📁 В директории prompthub" && pm2 status && echo "🌐 Проверка сайта:" && curl -s http://localhost:3000 | head -3
```

---

### 💾 3. СОЗДАНИЕ БЭКАПА
```bash
cp -r /root/prompthub /root/prompthub_backup_$(date +%Y%m%d_%H%M%S) && echo "✅ Бэкап создан в /root/prompthub_backup_$(date +%Y%m%d_%H%M%S)"
```

---

### 📥 4. ОБНОВЛЕНИЕ КОДА
```bash
cd /root/prompthub && git fetch origin && git reset --hard origin/main && echo "✅ Код обновлен до последней версии"
```

---

### 🔧 5. ПРОВЕРКА ЗАВИСИМОСТЕЙ
```bash
npm ci --production && echo "✅ Зависимости обновлены"
```

---

### 🏗️ 6. КРИТИЧЕСКИЙ ЭТАП - СБОРКА
```bash
echo "🏗️ Начинаем сборку..." && npm run build && echo "🔍 Проверяем сборку..." && if [ -f ".next/BUILD_ID" ]; then echo "✅ Сборка УСПЕШНА - BUILD_ID найден"; else echo "❌ КРИТИЧЕСКАЯ ОШИБКА: Сборка провалилась!"; exit 1; fi
```

---

### 🔄 7. ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ
```bash
echo "🔄 Перезапускаем приложение..." && pm2 restart all && pm2 save && echo "✅ Приложение перезапущено"
```

---

### 🧪 8. ПРОВЕРКА РАБОТОСПОСОБНОСТИ
```bash
echo "⏳ Ждем 5 секунд..." && sleep 5 && echo "📊 Статус PM2:" && pm2 status && echo "🌐 Проверка локального сайта:" && curl -s http://localhost:3000 | head -3 && echo "🔗 Проверка API:" && curl -s http://localhost:3000/api/prompts?limit=1 | head -3
```

---

### 📦 9. ИМПОРТ НОВЫХ ПРОМПТОВ
```bash
echo "📦 Импортируем новые промпты..." && npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub4.json && echo "✅ Новые промпты импортированы"
```

---

### ✅ 10. ФИНАЛЬНАЯ ПРОВЕРКА
```bash
echo "🌍 Проверяем внешний доступ..." && curl -s http://83.166.244.71:3000 | head -3 && echo "🔗 Проверяем внешний API:" && curl -s http://83.166.244.71:3000/api/prompts?limit=2 | head -5 && echo "🎉 ДЕПЛОЙ ЗАВЕРШЕН!"
```

---

## 🚨 ПЛАН ОТКАТА (если что-то пошло не так)

### Быстрый откат к предыдущей версии:
```bash
echo "🚨 ВЫПОЛНЯЕМ ОТКАТ..." && pm2 stop all && cd /root && rm -rf prompthub && mv prompthub_backup_* prompthub && cd prompthub && pm2 start ecosystem.config.js && pm2 save && echo "✅ Откат выполнен"
```

---

## 📋 ЧЕКЛИСТ УСПЕШНОГО ДЕПЛОЯ

- [ ] PM2 показывает статус "online"
- [ ] Сайт отвечает по http://83.166.244.71:3000  
- [ ] API возвращает JSON по `/api/prompts`
- [ ] Импортировано 10 новых промптов
- [ ] Нет ошибок 502 Bad Gateway

## 🎯 ГОТОВО К ВЫПОЛНЕНИЮ!

**Копируйте команды блок за блоком и выполняйте последовательно!**
