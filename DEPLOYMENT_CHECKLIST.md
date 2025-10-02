# 🚀 Чек-лист деплоя и отката

## 📋 Pre-deployment Checklist

### **1. Тестирование**
- [ ] ✅ Все unit тесты проходят (`npm test`)
- [ ] ✅ Все integration тесты проходят
- [ ] ✅ Все e2e тесты проходят (`npm run test:e2e`)
- [ ] ✅ Нагрузочные тесты пройдены (`k6 run load-tests/`)
- [ ] ✅ Покрытие кода >90% (`npm run coverage`)
- [ ] ✅ Линтер не выдает ошибок (`npm run lint`)
- [ ] ✅ Сборка проходит успешно (`npm run build`)

### **2. Код-ревью**
- [ ] ✅ Код проверен командой
- [ ] ✅ Безопасность проверена
- [ ] ✅ Производительность оценена
- [ ] ✅ Документация обновлена

### **3. Подготовка к деплою**
- [ ] ✅ Бэкап базы данных создан
- [ ] ✅ Конфигурация проверена
- [ ] ✅ Переменные окружения настроены
- [ ] ✅ Мониторинг настроен

## 🚀 Deployment Process

### **4. Деплой на сервер**

#### **4.1 Подключение к серверу**
```bash
# SSH подключение
ssh root@83.166.244.71

# Переход в директорию проекта
cd /root/prompthub
```

#### **4.2 Обновление кода**
```bash
# Получение последних изменений
git fetch origin
git reset --hard origin/main

# Установка зависимостей
npm install

# Генерация Prisma клиента
npx prisma generate
```

#### **4.3 Миграции базы данных**
```bash
# Применение миграций
npx prisma migrate deploy

# Проверка статуса БД
npx prisma db status
```

#### **4.4 Сборка приложения**
```bash
# Сборка для продакшена
npm run build

# Проверка сборки
ls -la .next/
```

#### **4.5 Перезапуск сервисов**
```bash
# Остановка приложения
pm2 stop prompthub || true
pm2 delete prompthub || true

# Запуск приложения
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Перезапуск Nginx
systemctl restart nginx
```

#### **4.6 Проверка статуса**
```bash
# Проверка PM2
pm2 status
pm2 logs prompthub --lines 50

# Проверка Nginx
systemctl status nginx

# Проверка портов
netstat -tlnp | grep :3000
```

## 📊 Post-deployment Monitoring

### **5. Мониторинг после деплоя**

#### **5.1 Проверка здоровья**
```bash
# Проверка API
curl -f http://localhost:3000/api/health

# Проверка метрик
curl -f http://localhost:3000/api/admin/search-metrics

# Проверка логов
pm2 logs prompthub --lines 100
```

#### **5.2 Метрики производительности**
- [ ] ✅ Время ответа API < 100ms
- [ ] ✅ Использование CPU < 80%
- [ ] ✅ Использование памяти < 80%
- [ ] ✅ Процент ошибок < 1%
- [ ] ✅ Процент отклоненных запросов < 5%

#### **5.3 Функциональное тестирование**
- [ ] ✅ Поиск работает корректно
- [ ] ✅ Валидация работает
- [ ] ✅ Фильтрация работает
- [ ] ✅ Метрики собираются
- [ ] ✅ Алерты настроены

## 🔄 Rollback Process

### **6. Процедура отката**

#### **6.1 Автоматический откат (если доступен)**
```bash
# Откат к предыдущей версии
git reset --hard HEAD~1

# Перезапуск сервисов
pm2 restart prompthub
```

#### **6.2 Ручной откат**
```bash
# Остановка приложения
pm2 stop prompthub

# Откат к предыдущей версии
git reset --hard <previous-commit-hash>

# Установка зависимостей
npm install

# Сборка
npm run build

# Запуск
pm2 start ecosystem.config.js
```

#### **6.3 Откат базы данных**
```bash
# Откат миграций (если необходимо)
npx prisma migrate rollback

# Восстановление из бэкапа (если необходимо)
# pg_restore -d prompthub backup.sql
```

## 🚨 Emergency Procedures

### **7. Экстренные процедуры**

#### **7.1 Критические ошибки**
```bash
# Немедленная остановка
pm2 stop prompthub

# Переключение на предыдущую версию
git checkout <stable-version>

# Быстрый перезапуск
pm2 start ecosystem.config.js
```

#### **7.2 Проблемы с базой данных**
```bash
# Проверка подключения к БД
npx prisma db status

# Восстановление из бэкапа
# pg_restore -d prompthub backup.sql

# Перезапуск приложения
pm2 restart prompthub
```

#### **7.3 Проблемы с производительностью**
```bash
# Мониторинг ресурсов
htop
df -h
free -h

# Очистка логов
pm2 flush

# Перезапуск сервисов
systemctl restart nginx
pm2 restart prompthub
```

## 📈 Monitoring & Alerts

### **8. Настройка мониторинга**

#### **8.1 Prometheus**
```bash
# Запуск Prometheus
docker run -d -p 9090:9090 -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

#### **8.2 Grafana**
```bash
# Запуск Grafana
docker run -d -p 3001:3000 grafana/grafana

# Импорт дашборда
# Загрузить monitoring/grafana-dashboard.json
```

#### **8.3 Алерты**
- [ ] ✅ Настроены алерты в Prometheus
- [ ] ✅ Уведомления в Slack/Email
- [ ] ✅ Эскалация при критических ошибках

## 🔍 Troubleshooting

### **9. Диагностика проблем**

#### **9.1 Логи**
```bash
# Логи приложения
pm2 logs prompthub

# Логи Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Системные логи
journalctl -u nginx -f
```

#### **9.2 Производительность**
```bash
# Мониторинг ресурсов
htop
iostat -x 1
netstat -tulpn

# Анализ медленных запросов
pm2 logs prompthub | grep "slow"
```

#### **9.3 База данных**
```bash
# Статус БД
npx prisma db status

# Проверка подключений
netstat -an | grep :5432

# Анализ запросов
# pg_stat_activity
```

## ✅ Success Criteria

### **10. Критерии успешного деплоя**

#### **10.1 Функциональность**
- [ ] ✅ Все API endpoints работают
- [ ] ✅ Поиск функционирует корректно
- [ ] ✅ Валидация работает правильно
- [ ] ✅ Метрики собираются
- [ ] ✅ Админ-панель доступна

#### **10.2 Производительность**
- [ ] ✅ Время ответа < 100ms
- [ ] ✅ Пропускная способность > 100 RPS
- [ ] ✅ Использование ресурсов в норме
- [ ] ✅ Нет утечек памяти

#### **10.3 Мониторинг**
- [ ] ✅ Метрики отображаются в Grafana
- [ ] ✅ Алерты настроены и работают
- [ ] ✅ Логи собираются корректно
- [ ] ✅ Дашборды обновляются

## 📞 Emergency Contacts

### **11. Контакты для экстренных случаев**
- **DevOps Lead:** [контакт]
- **Backend Team:** [контакт]
- **QA Team:** [контакт]
- **On-call Engineer:** [контакт]

## 📝 Post-deployment Tasks

### **12. Задачи после деплоя**
- [ ] ✅ Уведомить команду об успешном деплое
- [ ] ✅ Обновить документацию
- [ ] ✅ Запланировать мониторинг в течение 24 часов
- [ ] ✅ Подготовить отчет о деплое
- [ ] ✅ Запланировать ретроспективу
