# 🚀 ФИНАЛЬНЫЕ КОМАНДЫ ДЛЯ СЕРВЕРА

## ✅ ЧТО ИСПРАВЛЕНО
- ✅ Добавлено поле `instructions` в тип Prompt
- ✅ Убрано несуществующее свойство `trustHost` из NextAuth
- ✅ Исправлена сигнатура `onCopy` в PromptCardProps
- ✅ Все исправления закоммичены и отправлены в репозиторий

## 🎯 ФИНАЛЬНЫЕ КОМАНДЫ НА СЕРВЕРЕ

**ВЫ УЖЕ НА СЕРВЕРЕ, ВЫПОЛНИТЕ:**

```bash
# 1. Обновить код с исправлениями
git fetch origin
git reset --hard origin/main

# 2. Установить зависимости
npm install

# 3. Собрать приложение
npm run build

# 4. Запустить приложение
pm2 start ecosystem.config.js

# 5. Проверить статус
pm2 status

# 6. Сохранить конфигурацию
pm2 save

# 7. Импортировать промпты (если нужно)
npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json
```

## 🔍 ПРОВЕРКА РЕЗУЛЬТАТА

```bash
# Проверить статус PM2
pm2 status

# Проверить логи
pm2 logs prompthub --lines 10

# Проверить сайт локально
curl http://localhost:3000

# Проверить API
curl http://localhost:3000/api/prompts?limit=5
```

## ✅ ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
- ✅ Статус PM2: **online** (не errored)
- ✅ Сайт доступен: http://83.166.244.71:3000
- ✅ API работает: http://83.166.244.71:3000/api/prompts
- ✅ Новые промпты импортированы
- ✅ Логи без ошибок компиляции

**ВЫПОЛНИТЕ ЭТИ КОМАНДЫ СЕЙЧАС ДЛЯ ПОЛНОГО ВОССТАНОВЛЕНИЯ!**
