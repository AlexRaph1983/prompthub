# 🎯 ВЫПОЛНИТЕ ЭТИ КОМАНДЫ НА СЕРВЕРЕ ПРЯМО СЕЙЧАС

## 🔐 1. ПОДКЛЮЧЕНИЕ
```bash
ssh root@83.166.244.71
```
**Пароль**: `yqOdhMhP41s5827h`

---

## ⚡ 2. ВЫПОЛНИТЕ ВСЕ КОМАНДЫ ОДНИМ БЛОКОМ

**СКОПИРУЙТЕ И ВСТАВЬТЕ ВСЕ КОМАНДЫ СРАЗУ:**

```bash
# Переходим в директорию и проверяем состояние
cd /root/prompthub
echo "📊 Текущее состояние:"
pm2 status
curl -s http://localhost:3000 | head -2

# Создаем бэкап
echo "💾 Создаем бэкап..."
cp -r /root/prompthub /root/prompthub_backup_$(date +%Y%m%d_%H%M%S)
echo "✅ Бэкап создан"

# Обновляем код
echo "📥 Обновляем код..."
git fetch origin
git reset --hard origin/main
echo "✅ Код обновлен"

# Устанавливаем зависимости
echo "🔧 Проверяем зависимости..."
npm ci --production
echo "✅ Зависимости готовы"

# КРИТИЧЕСКИЙ ЭТАП - Сборка
echo "🏗️ КРИТИЧЕСКИЙ ЭТАП - Сборка приложения..."
npm run build

# Проверяем успешность сборки
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ СБОРКА УСПЕШНА - BUILD_ID найден"
    
    # Перезапускаем приложение
    echo "🔄 Перезапускаем приложение..."
    pm2 restart all
    pm2 save
    
    # Ждем и проверяем
    echo "⏳ Ждем 5 секунд для инициализации..."
    sleep 5
    
    echo "📊 Проверяем статус:"
    pm2 status
    
    echo "🌐 Проверяем сайт:"
    curl -s http://localhost:3000 | head -3
    
    echo "🔗 Проверяем API:"
    curl -s http://localhost:3000/api/prompts?limit=1
    
    # Импортируем новые промпты
    echo "📦 Импортируем новые промпты..."
    npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub4.json
    
    echo "🌍 Финальная проверка внешнего доступа:"
    curl -s http://83.166.244.71:3000 | head -2
    
    echo "🎉 ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН!"
    echo "✅ Сайт доступен: http://83.166.244.71:3000"
    
else
    echo "❌ КРИТИЧЕСКАЯ ОШИБКА: Сборка провалилась!"
    echo "🚨 BUILD_ID не найден - откатываемся..."
    
    # Откат к бэкапу
    pm2 stop all
    cd /root
    rm -rf prompthub
    mv prompthub_backup_* prompthub
    cd prompthub
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "✅ Откат выполнен - сайт восстановлен"
fi
```

---

## 🚨 ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК - БЫСТРЫЙ ОТКАТ

```bash
echo "🚨 АВАРИЙНЫЙ ОТКАТ..."
pm2 stop all
cd /root
rm -rf prompthub
mv prompthub_backup_* prompthub
cd prompthub
pm2 start ecosystem.config.js
pm2 save
echo "✅ Сайт восстановлен из бэкапа"
```

---

## ✅ ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После выполнения команд вы должны увидеть:

1. **"✅ СБОРКА УСПЕШНА"** - сборка прошла без ошибок
2. **PM2 статус "online"** - все процессы запущены  
3. **Сайт отвечает HTML** - главная страница загружается
4. **API возвращает JSON** - эндпоинт промптов работает
5. **"🎉 ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН!"** - все готово

## 🎯 ВЫПОЛНИТЕ СЕЙЧАС!

**Подключитесь к серверу и выполните команды выше!**
