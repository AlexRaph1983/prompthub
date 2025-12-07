#!/bin/bash
set -euo pipefail

echo "=========================================="
echo "📊 АНАЛИЗ ИСПОЛЬЗОВАНИЯ ДИСКОВОГО ПРОСТРАНСТВА"
echo "=========================================="
echo ""

# Общая информация о диске
echo "💾 ОБЩАЯ ИНФОРМАЦИЯ О ДИСКЕ:"
df -h / | tail -1
echo ""

# Размер корневой директории
echo "📁 РАЗМЕР КОРНЕВОЙ ДИРЕКТОРИИ:"
du -sh /root 2>/dev/null || echo "Не удалось прочитать /root"
echo ""

# Размер директории приложения
echo "📁 РАЗМЕР ДИРЕКТОРИИ ПРИЛОЖЕНИЯ:"
if [ -d /root/prompthub ]; then
    du -sh /root/prompthub 2>/dev/null || echo "Не удалось прочитать /root/prompthub"
    echo ""
    echo "  Детализация /root/prompthub:"
    du -sh /root/prompthub/* 2>/dev/null | sort -h | tail -10
fi
echo ""

# Бэкапы
echo "💾 БЭКАПЫ:"
if [ -d /root ]; then
    BACKUP_COUNT=$(find /root -maxdepth 1 -type d -name "backup_prompthub_*" 2>/dev/null | wc -l)
    BACKUP_SIZE=$(du -sh /root/backup_prompthub_* 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    echo "  Найдено бэкапов: $BACKUP_COUNT"
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo "  Размер всех бэкапов:"
        du -sh /root/backup_prompthub_* 2>/dev/null | head -5
        echo "  Список всех бэкапов (от старых к новым):"
        find /root -maxdepth 1 -type d -name "backup_prompthub_*" -printf "%T@ %p\n" 2>/dev/null | sort -n | awk '{print $2}' | head -10
    fi
fi
echo ""

# node_modules
echo "📦 NODE_MODULES:"
if [ -d /root/prompthub/node_modules ]; then
    NODE_MODULES_SIZE=$(du -sh /root/prompthub/node_modules 2>/dev/null | awk '{print $1}')
    echo "  Размер: $NODE_MODULES_SIZE"
fi
echo ""

# .next папки
echo "🏗️ NEXT.JS BUILD ARTIFACTS:"
if [ -d /root/prompthub/.next ]; then
    NEXT_SIZE=$(du -sh /root/prompthub/.next 2>/dev/null | awk '{print $1}')
    echo "  Размер .next: $NEXT_SIZE"
fi
echo ""

# PM2 логи
echo "📝 PM2 ЛОГИ:"
if command -v pm2 >/dev/null 2>&1; then
    PM2_LOG_SIZE=$(du -sh ~/.pm2/logs 2>/dev/null | awk '{print $1}' || echo "0")
    echo "  Размер логов PM2: $PM2_LOG_SIZE"
    echo "  Количество лог-файлов:"
    find ~/.pm2/logs -type f 2>/dev/null | wc -l
fi
echo ""

# npm кэш
echo "🗑️ NPM КЭШ:"
if command -v npm >/dev/null 2>&1; then
    NPM_CACHE_SIZE=$(npm cache verify 2>&1 | grep -oP 'verified \K[0-9]+' || echo "0")
    echo "  Размер кэша npm: $(du -sh ~/.npm 2>/dev/null | awk '{print $1}' || echo 'неизвестно')"
fi
echo ""

# Временные файлы
echo "🗂️ ВРЕМЕННЫЕ ФАЙЛЫ:"
TMP_SIZE=$(du -sh /tmp 2>/dev/null | awk '{print $1}' || echo "0")
echo "  Размер /tmp: $TMP_SIZE"
echo ""

# Старые логи системы
echo "📋 СИСТЕМНЫЕ ЛОГИ:"
if [ -d /var/log ]; then
    echo "  Размер /var/log:"
    du -sh /var/log/* 2>/dev/null | sort -h | tail -5
fi
echo ""

# Топ 10 самых больших директорий в /root
echo "🔝 ТОП-10 САМЫХ БОЛЬШИХ ДИРЕКТОРИЙ В /root:"
du -h /root 2>/dev/null | sort -rh | head -10
echo ""

echo "=========================================="
echo "✅ АНАЛИЗ ЗАВЕРШЕН"
echo "=========================================="

