# PowerShell скрипт для деплоя sitemap на сервер
# Запуск: .\deploy-sitemap.ps1

Write-Host "🚀 Деплой SEO Sitemap на сервер" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Blue

# Конфигурация
$SERVER = "root@your-server"
$PROJECT_PATH = "/root/prompthub"
$BASE_URL = "https://prompt-hub.site"

Write-Host "📋 Проверка локальных файлов..." -ForegroundColor Yellow

# Проверяем наличие необходимых файлов
$requiredFiles = @(
    "lib/sitemap.ts",
    "app/sitemap.xml/route.ts",
    "app/robots.txt/route.ts",
    "app/sitemaps/root.xml/route.ts",
    "app/sitemaps/[locale].xml/route.ts",
    "app/sitemaps/categories.xml/route.ts",
    "app/sitemaps/tags.xml/route.ts",
    "app/sitemaps/prompts-[page].xml/route.ts",
    "scripts/migrate-sitemap-indexes.js",
    "scripts/validate-sitemap.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - НЕ НАЙДЕН!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔧 Применение миграции БД..." -ForegroundColor Yellow
try {
    node scripts/migrate-sitemap-indexes.js
    Write-Host "  ✅ Миграция применена" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Ошибка миграции: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Запуск тестов..." -ForegroundColor Yellow
try {
    npm run test:sitemap
    Write-Host "  ✅ Unit тесты пройдены" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Тесты не пройдены: $_" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Сборка проекта..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "  ✅ Сборка завершена" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Ошибка сборки: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Деплой на сервер..." -ForegroundColor Yellow

# Команды для выполнения на сервере
$serverCommands = @"
cd $PROJECT_PATH
git fetch origin
git reset --hard origin/main
npm install
npm run sitemap:migrate
npm run build
pm2 restart all
"@

try {
    # Выполняем команды на сервере
    ssh $SERVER $serverCommands
    Write-Host "  ✅ Деплой завершен" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Ошибка деплоя: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Проверка sitemap..." -ForegroundColor Yellow

# Проверяем доступность sitemap
$sitemapUrls = @(
    "$BASE_URL/robots.txt",
    "$BASE_URL/sitemap.xml",
    "$BASE_URL/sitemaps/root.xml",
    "$BASE_URL/sitemaps/ru.xml",
    "$BASE_URL/sitemaps/en.xml",
    "$BASE_URL/sitemaps/categories.xml",
    "$BASE_URL/sitemaps/tags.xml"
)

foreach ($url in $sitemapUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ $url" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $url - Статус: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ $url - Ошибка: $_" -ForegroundColor Red
    }
}

Write-Host "🎯 Валидация sitemap..." -ForegroundColor Yellow
try {
    # Запускаем валидацию на сервере
    ssh $SERVER "cd $PROJECT_PATH && npm run sitemap:validate"
    Write-Host "  ✅ Валидация завершена" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Ошибка валидации: $_" -ForegroundColor Red
}

Write-Host "📊 Финальная проверка..." -ForegroundColor Yellow

# Проверяем robots.txt
try {
    $robotsContent = Invoke-WebRequest -Uri "$BASE_URL/robots.txt" -UseBasicParsing
    $robotsText = $robotsContent.Content
    
    $robotsChecks = @(
        "User-agent: *",
        "Disallow: /api/",
        "Disallow: /admin/",
        "Sitemap: $BASE_URL/sitemap.xml",
        "Host: prompt-hub.site"
    )
    
    foreach ($check in $robotsChecks) {
        if ($robotsText -match [regex]::Escape($check)) {
            Write-Host "  ✅ robots.txt: $check" -ForegroundColor Green
        } else {
            Write-Host "  ❌ robots.txt: $check - НЕ НАЙДЕН" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ❌ Ошибка проверки robots.txt: $_" -ForegroundColor Red
}

# Проверяем sitemap.xml
try {
    $sitemapContent = Invoke-WebRequest -Uri "$BASE_URL/sitemap.xml" -UseBasicParsing
    $sitemapText = $sitemapContent.Content
    
    $sitemapChecks = @(
        "<?xml version=`"1.0`" encoding=`"UTF-8`"?>",
        "<sitemapindex",
        "/sitemaps/root.xml",
        "/sitemaps/ru.xml",
        "/sitemaps/en.xml",
        "/sitemaps/categories.xml",
        "/sitemaps/tags.xml"
    )
    
    foreach ($check in $sitemapChecks) {
        if ($sitemapText -match [regex]::Escape($check)) {
            Write-Host "  ✅ sitemap.xml: $check" -ForegroundColor Green
        } else {
            Write-Host "  ❌ sitemap.xml: $check - НЕ НАЙДЕН" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ❌ Ошибка проверки sitemap.xml: $_" -ForegroundColor Red
}

Write-Host "🎉 Деплой sitemap завершен!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Blue
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Проверьте sitemap в Google Search Console" -ForegroundColor White
Write-Host "2. Добавьте sitemap в Яндекс.Вебмастер" -ForegroundColor White
Write-Host "3. Мониторьте логи: pm2 logs" -ForegroundColor White
Write-Host "4. Проверяйте индексацию в поисковиках" -ForegroundColor White
