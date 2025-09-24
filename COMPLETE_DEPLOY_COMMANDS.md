# 🚀 ЗАВЕРШАЕМ ДЕПЛОЙ - ВЫПОЛНИТЕ НА СЕРВЕРЕ

## ⚡ ВЫ УЖЕ НА СЕРВЕРЕ - ВЫПОЛНИТЕ ЭТИ КОМАНДЫ:

### 🏗️ 1. ЗАВЕРШАЕМ УСТАНОВКУ ЗАВИСИМОСТЕЙ
```bash
echo "✅ Зависимости готовы"
```

### 🔨 2. КРИТИЧЕСКИЙ ЭТАП - СБОРКА ПРИЛОЖЕНИЯ
```bash
echo "🏗️ КРИТИЧЕСКИЙ ЭТАП - Сборка приложения..."
npm run build
```

### ✅ 3. ПРОВЕРЯЕМ УСПЕШНОСТЬ СБОРКИ И ПРОДОЛЖАЕМ
```bash
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ СБОРКА УСПЕШНА - BUILD_ID найден"
    
    echo "🔄 Перезапускаем приложение..."
    pm2 restart all
    pm2 save
    
    echo "⏳ Ждем 5 секунд для инициализации..."
    sleep 5
    
    echo "📊 Проверяем статус:"
    pm2 status
    
    echo "🌐 Проверяем сайт:"
    curl -s http://localhost:3000 | head -3
    
    echo "🔗 Проверяем API:"
    curl -s http://localhost:3000/api/prompts?limit=1
    
    echo "📦 Импортируем новые промпты..."
    npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub4.json
    
    echo "🌍 Финальная проверка внешнего доступа:"
    curl -s http://83.166.244.71:3000 | head -2
    
    echo "🎉 ДЕПЛОЙ УСПЕШНО ЗАВЕРШЕН!"
    echo "✅ Сайт доступен: http://83.166.244.71:3000"
    
else
    echo "❌ КРИТИЧЕСКАЯ ОШИБКА: Сборка провалилась!"
    echo "🚨 BUILD_ID не найден - откатываемся..."
    
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

## 🎯 СКОПИРУЙТЕ И ВЫПОЛНИТЕ ВСЕ КОМАНДЫ СРАЗУ!

**Зависимости уже установлены, осталось только собрать и перезапустить!**
