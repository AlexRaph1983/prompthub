# Автоматический деплой раздела со статьями на продакшн
# Использует plink для автоматической аутентификации

$server = "83.166.244.71"
$username = "root"
$password = "yqOdhMhP41s5827h"

Write-Host "🚀 Запуск автоматического деплоя раздела статей..." -ForegroundColor Green
Write-Host ""

# Команды для выполнения на сервере
$deployCommands = @"
cd /root/prompthub && \
echo '📥 Fetching latest changes...' && \
git fetch origin && \
echo '🔄 Resetting to origin/main...' && \
git reset --hard origin/main && \
echo '📦 Running deploy script...' && \
bash scripts/deploy.sh && \
echo '' && \
echo '✅ Deploy script completed!' && \
echo '' && \
echo '🗄️ Applying database migration...' && \
npx prisma migrate deploy && \
echo '' && \
echo '✅ Migration applied!' && \
echo '' && \
echo '🌱 Seeding first article...' && \
npx tsx scripts/seed-articles.ts && \
echo '' && \
echo '✨ All done! Articles section is live!' && \
echo '' && \
echo '🔗 Check it out at:' && \
echo '   - https://prompt-hub.site/ru/articles' && \
echo '   - https://prompt-hub.site/en/articles'
"@

Write-Host "📡 Connecting to server $server..." -ForegroundColor Cyan

# Используем plink для автоматической аутентификации
if (Test-Path ".\plink.exe") {
    Write-Host "Using plink.exe from current directory" -ForegroundColor Green
    & .\plink.exe -batch -pw $password "$username@$server" $deployCommands
} else {
    Write-Host "plink.exe not found, trying to download..." -ForegroundColor Yellow
    try {
        $plinkUrl = "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe"
        Invoke-WebRequest -Uri $plinkUrl -OutFile "plink.exe"
        Write-Host "plink.exe downloaded" -ForegroundColor Green
        & .\plink.exe -batch -pw $password "$username@$server" $deployCommands
    } catch {
        Write-Host "Failed to download plink.exe: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open https://prompt-hub.site/ru/articles" -ForegroundColor White
Write-Host "   2. Check the first article: https://prompt-hub.site/ru/articles/prompty-dlya-excel-i-google-sheets" -ForegroundColor White
Write-Host "   3. Verify sitemap: https://prompt-hub.site/sitemaps/articles.xml" -ForegroundColor White
Write-Host "   4. Test related articles widget on any prompt page" -ForegroundColor White
Write-Host ""

