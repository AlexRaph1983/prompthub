#!/bin/bash

# Скрипт деплоя с мониторингом
set -e

echo "🚀 Начинаем деплой системы поиска с мониторингом..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Проверка подключения к серверу
check_connection() {
    log "Проверяем подключение к серверу..."
    if ! ping -c 1 83.166.244.71 > /dev/null 2>&1; then
        error "Не удается подключиться к серверу 83.166.244.71"
    fi
    log "Подключение к серверу успешно"
}

# Выполнение команд на сервере
run_on_server() {
    local command="$1"
    log "Выполняем: $command"
    
    ssh root@83.166.244.71 "$command" || {
        error "Ошибка выполнения команды: $command"
    }
}

# Создание бэкапа
create_backup() {
    log "Создаем бэкап базы данных..."
    run_on_server "cd /root/prompthub && cp dev.db dev.db.backup.$(date +%Y%m%d_%H%M%S)"
    log "Бэкап создан успешно"
}

# Обновление кода
update_code() {
    log "Обновляем код на сервере..."
    run_on_server "cd /root/prompthub && git fetch origin && git reset --hard origin/main"
    log "Код обновлен успешно"
}

# Установка зависимостей
install_dependencies() {
    log "Устанавливаем зависимости..."
    run_on_server "cd /root/prompthub && npm install"
    log "Зависимости установлены"
}

# Применение миграций
apply_migrations() {
    log "Применяем миграции базы данных..."
    run_on_server "cd /root/prompthub && npx prisma generate"
    run_on_server "cd /root/prompthub && npx prisma db push"
    log "Миграции применены успешно"
}

# Сборка приложения
build_application() {
    log "Собираем приложение..."
    run_on_server "cd /root/prompthub && npm run build"
    log "Приложение собрано успешно"
}

# Перезапуск сервисов
restart_services() {
    log "Перезапускаем сервисы..."
    
    # Остановка приложения
    run_on_server "pm2 stop prompthub || true"
    run_on_server "pm2 delete prompthub || true"
    
    # Запуск приложения
    run_on_server "cd /root/prompthub && pm2 start ecosystem.config.js"
    run_on_server "pm2 save"
    
    # Перезапуск Nginx
    run_on_server "systemctl restart nginx"
    
    log "Сервисы перезапущены"
}

# Проверка здоровья
health_check() {
    log "Проверяем здоровье системы..."
    
    # Проверка PM2
    run_on_server "pm2 status prompthub"
    
    # Проверка Nginx
    run_on_server "systemctl status nginx --no-pager"
    
    # Проверка API
    log "Проверяем API endpoints..."
    if curl -f http://83.166.244.71/api/health > /dev/null 2>&1; then
        log "API health check пройден"
    else
        warning "API health check не пройден"
    fi
    
    # Проверка метрик
    if curl -f http://83.166.244.71/api/admin/search-metrics > /dev/null 2>&1; then
        log "Метрики доступны"
    else
        warning "Метрики недоступны"
    fi
}

# Настройка мониторинга
setup_monitoring() {
    log "Настраиваем мониторинг..."
    
    # Копируем конфигурацию мониторинга
    scp monitoring/prometheus.yml root@83.166.244.71:/root/
    scp monitoring/alert_rules.yml root@83.166.244.71:/root/
    scp monitoring/grafana-dashboard.json root@83.166.244.71:/root/
    
    log "Конфигурация мониторинга скопирована"
}

# Запуск тестов
run_tests() {
    log "Запускаем тесты..."
    
    # Unit тесты
    run_on_server "cd /root/prompthub && npm test -- --passWithNoTests"
    
    # E2E тесты (если доступны)
    if run_on_server "cd /root/prompthub && npx playwright test --version" > /dev/null 2>&1; then
        run_on_server "cd /root/prompthub && npx playwright test __tests__/e2e/search-validation.e2e.test.ts"
    else
        warning "Playwright не установлен, пропускаем E2E тесты"
    fi
    
    log "Тесты выполнены"
}

# Основная функция
main() {
    log "🚀 Начинаем деплой системы поиска с мониторингом"
    
    # Проверки
    check_connection
    
    # Создание бэкапа
    create_backup
    
    # Обновление кода
    update_code
    
    # Установка зависимостей
    install_dependencies
    
    # Применение миграций
    apply_migrations
    
    # Сборка приложения
    build_application
    
    # Перезапуск сервисов
    restart_services
    
    # Ожидание запуска
    log "Ожидаем запуска сервисов..."
    sleep 10
    
    # Проверка здоровья
    health_check
    
    # Настройка мониторинга
    setup_monitoring
    
    # Запуск тестов
    run_tests
    
    log "✅ Деплой завершен успешно!"
    log "🌐 Сайт доступен по адресу: http://83.166.244.71"
    log "📊 Админ-панель: http://83.166.244.71/admin"
    log "📈 Метрики: http://83.166.244.71/api/admin/search-metrics"
}

# Обработка ошибок
trap 'error "Деплой прерван из-за ошибки"' ERR

# Запуск
main "$@"
