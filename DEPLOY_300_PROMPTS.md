# Деплой 300 новых промптов на продакшн

## Шаг 1: Деплой кода (без миграций/сидов)

Выполните на сервере:

```bash
cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh
```

**Важно:** Скрипт `deploy.sh` НЕ запускает миграции/сиды (RUN_DB_MIGRATIONS=0 по умолчанию), как указано в правилах.

## Шаг 2: Импорт 300 промптов

После успешного деплоя выполните:

```bash
cd /root/prompthub
node scripts/import-prompts-from-file-safe.js \
  --file=data/generated_prompts_ru_300.json \
  --authorEmail=content-architect@prompthub.local \
  --dryRun=false \
  --batch=25
```

## Шаг 3: Проверка результата

```bash
node scripts/verify-import.js --authorEmail=content-architect@prompthub.local
```

Ожидаемый результат:
- `totalPrompts`: должно увеличиться на 300
- `importedByAuthor`: 300
- `videoPromptCountCached`: должно увеличиться

## Альтернатива: один скрипт

Можно выполнить всё одной командой:

```bash
cd /root/prompthub && \
git fetch origin && \
git reset --hard origin/main && \
bash scripts/deploy.sh && \
sleep 5 && \
node scripts/import-prompts-from-file-safe.js --file=data/generated_prompts_ru_300.json --authorEmail=content-architect@prompthub.local --dryRun=false --batch=25 && \
node scripts/verify-import.js --authorEmail=content-architect@prompthub.local
```

## Что было добавлено

1. **300 новых RU-промптов** в категорию `video` (по распределению просмотров)
2. **Длина промптов**: 500-1000 символов
3. **Автор**: `content-architect@prompthub.local`
4. **Безопасный импорт**: транзакционные батчи, валидация, rollback при ошибках
5. **Автосинхронизация**: счётчики категорий обновляются автоматически

## Проверка на сайте

После импорта проверьте:
- Общее количество промптов увеличилось на 300
- Категория "video" содержит новые промпты
- Существующие промпты не затронуты
- Промпты отображаются корректно в интерфейсе

