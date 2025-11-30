# Деплой раздела со статьями на продакшн

## ⚠️ Важные замечания

1. **НЕ ЗАПУСКАТЬ** `migrate` и `seed` автоматически в деплой-скрипте
2. Миграция БД уже применена локально
3. Seed скрипт нужно запустить вручную после деплоя

---

## 📋 Чеклист перед деплоем

- [x] Код скомпилирован без ошибок TypeScript
- [x] Линтер не показывает ошибок
- [x] Билд проекта проходит успешно
- [x] Миграция создана и применена локально
- [x] Первая статья создана через seed
- [x] Все файлы закоммичены

---

## 🚀 Шаги деплоя

### 1. Подготовка на локальной машине

```bash
# Убедитесь, что все изменения закоммичены
git status

# Если есть незакоммиченные изменения
git add .
git commit -m "feat: add articles section with full SEO and integration"
git push origin main
```

### 2. Подключение к серверу

**Сервер:** Orange Curium  
**IP:** 83.166.244.71  
**Логин:** root  
**Пароль:** yqOdhMhP41s5827h

```bash
ssh root@83.166.244.71
# Пароль: yqOdhMhP41s5827h
```

### 3. Деплой кода

```bash
cd /root/prompthub
git fetch origin
git reset --hard origin/main
bash scripts/deploy.sh
```

⚠️ **ВАЖНО:** Скрипт `deploy.sh` НЕ должен запускать `migrate` и `seed`!

### 4. Применение миграции БД

После успешного деплоя, применить миграцию:

```bash
cd /root/prompthub
npx prisma migrate deploy
```

Эта команда применит миграцию `20251130152559_add_articles`, которая создаст таблицы:
- `Article`
- `ArticleTag`

### 5. Создание первой статьи

Запустить seed скрипт для создания первой статьи:

```bash
cd /root/prompthub
npx tsx scripts/seed-articles.ts
```

Вы должны увидеть:

```
🌱 Starting articles seeding...
✅ Using author: [имя автора] ([id])
✅ Tags created/updated: 4
✅ Article created: Промпты для Excel и Google Sheets...
✨ Articles seeding completed successfully!
```

### 6. Проверка результата

Откройте в браузере:

1. **Список статей:**
   - RU: https://prompt-hub.site/ru/articles
   - EN: https://prompt-hub.site/en/articles

2. **Первая статья:**
   - RU: https://prompt-hub.site/ru/articles/prompty-dlya-excel-i-google-sheets
   - EN: https://prompt-hub.site/en/articles/prompty-dlya-excel-i-google-sheets

3. **Sitemap статей:**
   - https://prompt-hub.site/sitemaps/articles.xml

4. **Корневой sitemap (должен включать articles.xml):**
   - https://prompt-hub.site/sitemap.xml

5. **Виджет на странице промпта:**
   - Откройте любой промпт с тегами Excel/Google Sheets/Automation
   - Под отзывами должен быть блок "📚 Полезные статьи по теме"

---

## ✅ Что проверить после деплоя

### SEO и метаданные

1. Откройте статью и проверьте исходный код (View Page Source):
   - [ ] `<title>` содержит название статьи
   - [ ] `<meta name="description">` присутствует
   - [ ] Open Graph теги (`og:title`, `og:description`, `og:image`)
   - [ ] JSON-LD структурированные данные (`<script type="application/ld+json">`)
   - [ ] hreflang теги для RU/EN версий

2. Проверьте через инструменты:
   - Google Search Console (после индексации)
   - Rich Results Test: https://search.google.com/test/rich-results
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/

### Функциональность

- [ ] Список статей загружается
- [ ] Статья открывается на обоих языках
- [ ] Оглавление работает (клик → smooth scroll)
- [ ] Кнопки "Поделиться" работают
- [ ] Теги кликабельны и ведут на страницы тегов
- [ ] Блок связанных промптов отображается
- [ ] Виджет статей на страницах промптов работает
- [ ] Счетчик просмотров увеличивается

### Производительность

- [ ] Страницы загружаются быстро (<2 сек)
- [ ] Нет ошибок в консоли браузера
- [ ] Нет ошибок 500 на сервере
- [ ] Логи не содержат критических ошибок

---

## 🐛 Troubleshooting

### Проблема: Миграция не применяется

**Решение:**
```bash
# Проверить статус миграций
npx prisma migrate status

# Если нужно, применить принудительно
npx prisma migrate resolve --applied 20251130152559_add_articles
npx prisma migrate deploy
```

### Проблема: Seed скрипт падает с ошибкой

**Решение 1:** Проверить, что миграция применена:
```bash
npx prisma migrate status
```

**Решение 2:** Проверить, что есть хотя бы один пользователь:
```bash
npx prisma studio
# Откройте модель User и проверьте наличие записей
```

### Проблема: Статьи не отображаются

**Решение:**
```bash
# Проверить, что статьи есть в БД
npx prisma studio
# Откройте модель Article и проверьте:
# - есть ли записи
# - status = "published"
# - publishedAt заполнен
```

### Проблема: 404 на страницах статей

**Решение:**
```bash
# Перезапустить сервер Next.js
pm2 restart prompthub
# или
npm run start
```

### Проблема: Виджет статей не показывается

**Проверить:**
1. Есть ли общие теги между промптом и статьями
2. API endpoint `/api/articles/by-tags` работает:
   ```bash
   curl "https://prompt-hub.site/api/articles/by-tags?tags=excel,automation&limit=3"
   ```
3. Нет ли ошибок в консоли браузера

---

## 📊 Мониторинг

### Проверка логов

```bash
# PM2 логи
pm2 logs prompthub

# Системные логи
journalctl -u prompthub -f

# Логи Next.js
tail -f /root/prompthub/.next/trace
```

### Метрики

После деплоя следите за:
- Количество просмотров статей (в БД)
- Время загрузки страниц
- Ошибки в логах
- Запросы к API `/api/articles/by-tags`

---

## 🔄 Откат (если что-то пошло не так)

### Откат кода

```bash
cd /root/prompthub
git reset --hard HEAD~1  # откат на предыдущий коммит
npm install
npm run build
pm2 restart prompthub
```

### Откат миграции

⚠️ **Не рекомендуется**, так как может привести к потере данных

Если критично:
```bash
# Создать резервную копию БД
cp prisma/dev.db prisma/dev.db.backup

# Откатить миграцию (опасно!)
npx prisma migrate resolve --rolled-back 20251130152559_add_articles
```

---

## 📞 Контакты

Если возникли проблемы:
- Email: team@prompt-hub.site
- Документация: `docs/content-architecture.md`
- Итоги: `ARTICLES_IMPLEMENTATION_SUMMARY.md`

---

## ✨ После успешного деплоя

1. **Уведомить команду** о новом функционале
2. **Добавить ссылку на статьи** в главное меню (если еще не добавлена)
3. **Написать пост** в соцсетях о первой статье
4. **Подготовить следующие статьи** используя шаблон

---

_Создано: 30 ноября 2025_
_Готово к деплою! 🚀_

