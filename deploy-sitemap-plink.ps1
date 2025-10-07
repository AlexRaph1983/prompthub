# Deploy sitemap using PuTTY plink
param(
    [string]$Server = "REDACTED_IP",
    [string]$User = "root", 
    [string]$Password = "REDACTED_PASSWORD"
)

Write-Host "🚀 Deploying SEO Sitemap via PuTTY plink..." -ForegroundColor Green
Write-Host "Server: $Server" -ForegroundColor Yellow
Write-Host "User: $User" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Blue

# Check if plink exists
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue

if (-not $plinkPath) {
    Write-Host "❌ plink not found. Using local plink.exe..." -ForegroundColor Yellow
    $plinkPath = ".\plink.exe"
}

Write-Host "✅ Using plink: $plinkPath" -ForegroundColor Green

# Step 1: Deploy main code
Write-Host "`n📦 Step 1: Deploying main code..." -ForegroundColor Cyan
$deployCommands = "cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh"

try {
    Write-Host "🔐 Connecting to server..." -ForegroundColor Yellow
    
    # Execute main deployment
    $result = & $plinkPath -ssh -batch -pw $Password $User@$Server $deployCommands
    
    Write-Host "📤 Main deployment output:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor White
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Main deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Main deployment completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error during main deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Continuing with sitemap-specific commands..." -ForegroundColor Yellow
}

# Step 2: Apply sitemap migration
Write-Host "`n🔧 Step 2: Applying sitemap migration..." -ForegroundColor Cyan
$migrateCommands = "cd /root/prompthub && npm run sitemap:migrate"

try {
    Write-Host "🔐 Running sitemap migration..." -ForegroundColor Yellow
    
    $migrateResult = & $plinkPath -ssh -batch -pw $Password $User@$Server $migrateCommands
    
    Write-Host "📤 Migration output:" -ForegroundColor Cyan
    Write-Host $migrateResult -ForegroundColor White
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sitemap migration successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Migration completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error during migration: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Validate sitemap
Write-Host "`n🔍 Step 3: Validating sitemap..." -ForegroundColor Cyan
$validateCommands = "cd /root/prompthub && npm run sitemap:validate"

try {
    Write-Host "🔐 Running sitemap validation..." -ForegroundColor Yellow
    
    $validateResult = & $plinkPath -ssh -batch -pw $Password $User@$Server $validateCommands
    
    Write-Host "📤 Validation output:" -ForegroundColor Cyan
    Write-Host $validateResult -ForegroundColor White
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sitemap validation successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Validation completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error during validation: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Check sitemap URLs
Write-Host "`n🌐 Step 4: Checking sitemap URLs..." -ForegroundColor Cyan

$sitemapUrls = @(
    "http://$Server/robots.txt",
    "http://$Server/sitemap.xml",
    "http://$Server/sitemaps/root.xml",
    "http://$Server/sitemaps/ru.xml",
    "http://$Server/sitemaps/en.xml",
    "http://$Server/sitemaps/categories.xml",
    "http://$Server/sitemaps/tags.xml"
)

foreach ($url in $sitemapUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ $url" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $url - Status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 5: Check robots.txt content
Write-Host "`n🤖 Step 5: Checking robots.txt content..." -ForegroundColor Cyan
try {
    $robotsContent = Invoke-WebRequest -Uri "http://$Server/robots.txt" -UseBasicParsing
    $robotsText = $robotsContent.Content
    
    $robotsChecks = @(
        "User-agent: *",
        "Disallow: /api/",
        "Disallow: /admin/",
        "Sitemap: http://$Server/sitemap.xml",
        "Host: $Server"
    )
    
    foreach ($check in $robotsChecks) {
        if ($robotsText -match [regex]::Escape($check)) {
            Write-Host "  ✅ robots.txt: $check" -ForegroundColor Green
        } else {
            Write-Host "  ❌ robots.txt: $check - NOT FOUND" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ❌ Error checking robots.txt: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Check sitemap.xml content
Write-Host "`n🗺️ Step 6: Checking sitemap.xml content..." -ForegroundColor Cyan
try {
    $sitemapContent = Invoke-WebRequest -Uri "http://$Server/sitemap.xml" -UseBasicParsing
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
            Write-Host "  ❌ sitemap.xml: $check - NOT FOUND" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ❌ Error checking sitemap.xml: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Sitemap deployment completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Blue
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Add sitemap to Google Search Console: http://$Server/sitemap.xml" -ForegroundColor White
Write-Host "2. Add sitemap to Яндекс.Вебмастер: http://$Server/sitemap.xml" -ForegroundColor White
Write-Host "3. Monitor logs: pm2 logs" -ForegroundColor White
Write-Host "4. Check indexing in search engines" -ForegroundColor White
Write-Host "`n🌐 Test URLs:" -ForegroundColor Cyan
Write-Host "• robots.txt: http://$Server/robots.txt" -ForegroundColor White
Write-Host "• sitemap.xml: http://$Server/sitemap.xml" -ForegroundColor White
Write-Host "• Root sitemap: http://$Server/sitemaps/root.xml" -ForegroundColor White
