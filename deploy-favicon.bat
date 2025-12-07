@echo off
echo 🚀 Деплой фавиконки на сервер Orange Curium...
echo.

echo 📋 Выполняем команды на сервере:
echo cd /root/prompthub ^&^& git fetch origin ^&^& git reset --hard origin/main ^&^& bash scripts/deploy.sh
echo.

echo 🔧 Подключение к серверу YOUR_SERVER_IP_HERE...
echo Пароль: YOUR_PASSWORD_HERE
echo.

ssh root@YOUR_SERVER_IP_HERE "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Деплой завершен успешно!
    echo 🌐 Сайт доступен по адресу: https://prompt-hub.site
    echo 📱 Новая фавиконка 120x120 добавлена!
) else (
    echo.
    echo ❌ Ошибка при деплое!
    echo 📝 Ручной деплой:
    echo 1. Подключитесь к серверу: ssh root@YOUR_SERVER_IP_HERE
    echo 2. Выполните команду: cd /root/prompthub ^&^& git fetch origin ^&^& git reset --hard origin/main ^&^& bash scripts/deploy.sh
)

pause
