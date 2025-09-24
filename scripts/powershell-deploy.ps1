# PowerShell деплой на сервер
param(
    [string]$ServerIP = "REDACTED_IP",
    [string]$Username = "root",
    [string]$Password = "REDACTED_PASSWORD"
)

Write-Host "🚀 POWERSHELL ДЕПЛОЙ НА СЕРВЕР" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Создаем сессию SSH
$session = New-PSSession -HostName $ServerIP -UserName $Username -Password (ConvertTo-SecureString $Password -AsPlainText -Force)

if ($session) {
    Write-Host "✅ SSH сессия установлена" -ForegroundColor Green
    
    try {
        # Шаг 1: Обновление кода
        Write-Host "`n1. Обновление кода..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            git fetch origin
            git reset --hard origin/main
        }
        Write-Host "✅ Код обновлен" -ForegroundColor Green
        
        # Шаг 2: Установка зависимостей
        Write-Host "`n2. Установка зависимостей..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            npm install
        }
        Write-Host "✅ Зависимости установлены" -ForegroundColor Green
        
        # Шаг 3: Обновление Prisma
        Write-Host "`n3. Обновление Prisma..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            npx prisma generate
        }
        Write-Host "✅ Prisma обновлен" -ForegroundColor Green
        
        # Шаг 4: Обновление базы данных
        Write-Host "`n4. Обновление базы данных..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            npx prisma db push --accept-data-loss
        }
        Write-Host "✅ База данных обновлена" -ForegroundColor Green
        
        # Шаг 5: Импорт промптов
        Write-Host "`n5. Импорт промптов..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            npx tsx scripts/add-promptmaster-prompts.ts --file prompts_prompthub3.json
        }
        Write-Host "✅ Промпты импортированы" -ForegroundColor Green
        
        # Шаг 6: Сборка приложения
        Write-Host "`n6. Сборка приложения..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            npm run build
        }
        Write-Host "✅ Приложение собрано" -ForegroundColor Green
        
        # Шаг 7: Перезапуск приложения
        Write-Host "`n7. Перезапуск приложения..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            pm2 stop prompthub 2>$null
            pm2 delete prompthub 2>$null
            pm2 start ecosystem.config.js 2>$null || pm2 start npm --name "prompthub" -- start
        }
        Write-Host "✅ Приложение перезапущено" -ForegroundColor Green
        
        # Шаг 8: Сохранение конфигурации
        Write-Host "`n8. Сохранение конфигурации..." -ForegroundColor Yellow
        Invoke-Command -Session $session -ScriptBlock {
            cd /root/prompthub
            pm2 save
        }
        Write-Host "✅ Конфигурация сохранена" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Ошибка при выполнении деплоя: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        Remove-PSSession $session
        Write-Host "`n🔌 SSH сессия закрыта" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Не удалось установить SSH сессию" -ForegroundColor Red
}

# Проверка результата
Write-Host "`n🔍 ПРОВЕРКА РЕЗУЛЬТАТА..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://$ServerIP:3000/api/prompts?limit=10" -UseBasicParsing -TimeoutSec 10
    $prompts = $response.Content | ConvertFrom-Json
    Write-Host "✅ API работает. Найдено промптов: $($prompts.items.Count)" -ForegroundColor Green
    
    # Проверяем наличие новых промптов
    $newPrompts = $prompts.items | Where-Object { $_.title -like "*питание*" -or $_.title -like "*тренировка*" -or $_.title -like "*бюджет*" }
    if ($newPrompts.Count -gt 0) {
        Write-Host "🎉 НОВЫЕ ПРОМПТЫ НАЙДЕНЫ НА САЙТЕ!" -ForegroundColor Green
        $newPrompts | ForEach-Object { Write-Host "  • $($_.title)" -ForegroundColor Cyan }
    } else {
        Write-Host "⚠️  Новые промпты не найдены. Возможно, импорт не прошел." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка при проверке API: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🌐 Сайт: http://$ServerIP:3000" -ForegroundColor Cyan
Write-Host "📊 API: http://$ServerIP:3000/api/prompts?limit=10" -ForegroundColor Cyan
