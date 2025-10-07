# 🚀 Инструкции по деплою SEO Sitemap

## Быстрый старт

### 1. Применение миграции БД
```bash
# Применить индексы для производительности sitemap
npm run sitemap:migrate
```

### 2. Проверка локально
```bash
# Запуск dev сервера
npm run dev

# Проверка sitemap (в другом терминале)
npm run sitemap:validate
```

### 3. Тестирование
```bash
# Unit тесты
npm run test:sitemap

# E2E тесты
npm run test:sitemap:e2e
```

## Деплой на сервер

### Автоматический деплой
```bash
# Используйте существующий скрипт деплоя
cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh
```

### Ручной деплой
```bash
# 1. Подключение к серверу
ssh root@your-server

# 2. Переход в директорию проекта
cd /root/prompthub

# 3. Обновление кода
git fetch origin
git reset --hard origin/main

# 4. Применение миграции (если не применена)
npm run sitemap:migrate

# 5. Сборка проекта
npm run build

# 6. Перезапуск сервиса
pm2 restart all

# 7. Проверка sitemap
curl -I https://prompt-hub.site/sitemap.xml
curl -I https://prompt-hub.site/robots.txt
```

## Проверка после деплоя

### 1. Базовые проверки
```bash
# Проверка доступности
curl -I https://prompt-hub.site/robots.txt
curl -I https://prompt-hub.site/sitemap.xml

# Проверка содержимого
curl https://prompt-hub.site/robots.txt
curl https://prompt-hub.site/sitemap.xml
```

### 2. Валидация sitemap
```bash
# Запуск скрипта валидации
npm run sitemap:validate
```

### 3. Проверка в поисковиках

#### Google Search Console
1. Откройте [Google Search Console](https://search.google.com/search-console)
2. Перейдите в "Sitemaps"
3. Добавьте `https://prompt-hub.site/sitemap.xml`
4. Проверьте статус индексации

#### Яндекс.Вебмастер
1. Откройте [Яндекс.Вебмастер](https://webmaster.yandex.ru)
2. Перейдите в "Индексирование" → "Файлы Sitemap"
3. Добавьте `https://prompt-hub.site/sitemap.xml`
4. Проверьте статус обработки

## Мониторинг

### Логи sitemap
```bash
# Просмотр логов Next.js
pm2 logs

# Фильтрация по sitemap
pm2 logs | grep -i sitemap
```

### Метрики производительности
```bash
# Проверка времени ответа
time curl -s https://prompt-hub.site/sitemap.xml > /dev/null
time curl -s https://prompt-hub.site/robots.txt > /dev/null
```

## Troubleshooting

### Проблема: Sitemap возвращает 500 ошибку
**Решение:**
```bash
# 1. Проверьте логи
pm2 logs

# 2. Проверьте подключение к БД
npm run test:prisma

# 3. Перезапустите сервис
pm2 restart all
```

### Проблема: Медленная генерация sitemap
**Решение:**
```bash
# 1. Проверьте индексы БД
npx prisma studio

# 2. Очистите кэш
pm2 restart all

# 3. Уменьшите лимит в lib/sitemap.ts
# PROMPTS_PER_PAGE: 5000
```

### Проблема: Невалидный XML
**Решение:**
```bash
# 1. Проверьте кодировку
curl -H "Accept-Encoding: gzip" https://prompt-hub.site/sitemap.xml

# 2. Валидируйте XML
xmllint --noout https://prompt-hub.site/sitemap.xml
```

## Конфигурация для продакшена

### Переменные окружения
```bash
# В .env.production
BASE_URL=https://prompt-hub.site
SITEMAP_CACHE_TTL=3600
SITEMAP_MAX_URLS=10000
```

### Nginx конфигурация
```nginx
# Добавить в nginx.conf
location /sitemap.xml {
    proxy_pass http://localhost:3000/sitemap.xml;
    proxy_cache_valid 200 1h;
}

location /robots.txt {
    proxy_pass http://localhost:3000/robots.txt;
    proxy_cache_valid 200 24h;
}

location /sitemaps/ {
    proxy_pass http://localhost:3000/sitemaps/;
    proxy_cache_valid 200 1h;
}
```

## Обновление sitemap

### Автоматическое обновление
Sitemap обновляется автоматически каждые 1 час (revalidate=3600).

### Принудительное обновление
```bash
# Очистка кэша и перезапуск
pm2 restart all

# Или через API (если реализовано)
curl -X POST https://prompt-hub.site/api/sitemap/refresh
```

## Безопасность

### Защита от DDoS
- Rate limiting на уровне Nginx
- Кэширование результатов
- Валидация параметров

### Приватные данные
- Исключены все служебные маршруты
- Нет утечек пользовательских данных
- Фильтрация по авторизации

## Производительность

### Оптимизация
- Индексы БД для быстрых запросов
- Кэширование результатов
- Пагинация больших карт
- Сжатие ответов

### Мониторинг
- Время генерации карт
- Количество URL в картах
- Статус кэша
- Ошибки генерации

## Поддержка

### Логи и отладка
```bash
# Включение debug логов
DEBUG=sitemap* npm run dev

# Просмотр метрик
pm2 monit
```

### Контакты
При проблемах с sitemap:
1. Проверьте логи: `pm2 logs`
2. Запустите валидацию: `npm run sitemap:validate`
3. Проверьте статус БД: `npm run test:prisma`
