# Deploy sitemap using PuTTY plink
param(
    [string]$Server = "REDACTED_IP",
    [string]$User = "root", 
    [string]$Password = "REDACTED_PASSWORD"
)

Write-Host "Deploying SEO Sitemap via PuTTY plink..." -ForegroundColor Green
Write-Host "Server: $Server" -ForegroundColor Yellow
Write-Host "User: $User" -ForegroundColor Yellow

# Check if plink exists
$plinkPath = Get-Command plink -ErrorAction SilentlyContinue

if (-not $plinkPath) {
    Write-Host "Using local plink.exe..." -ForegroundColor Yellow
    $plinkPath = ".\plink.exe"
}

Write-Host "Using plink: $plinkPath" -ForegroundColor Green

# Step 1: Deploy main code
Write-Host "Step 1: Deploying main code..." -ForegroundColor Cyan
$deployCommands = "cd /root/prompthub; git fetch origin; git reset --hard origin/main; bash scripts/deploy.sh"

try {
    Write-Host "Connecting to server..." -ForegroundColor Yellow
    
    $result = & $plinkPath -ssh -batch -pw $Password $User@$Server $deployCommands
    
    Write-Host "Main deployment output:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor White
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Main deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "Main deployment completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error during main deployment: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Apply sitemap migration
Write-Host "Step 2: Applying sitemap migration..." -ForegroundColor Cyan
$migrateCommands = "cd /root/prompthub; npm run sitemap:migrate"

try {
    Write-Host "Running sitemap migration..." -ForegroundColor Yellow
    
    $migrateResult = & $plinkPath -ssh -batch -pw $Password $User@$Server $migrateCommands
    
    Write-Host "Migration output:" -ForegroundColor Cyan
    Write-Host $migrateResult -ForegroundColor White
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Sitemap migration successful!" -ForegroundColor Green
    } else {
        Write-Host "Migration completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error during migration: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Check sitemap URLs
Write-Host "Step 3: Checking sitemap URLs..." -ForegroundColor Cyan

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
            Write-Host "  OK $url" -ForegroundColor Green
        } else {
            Write-Host "  FAIL $url - Status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  FAIL $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Sitemap deployment completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add sitemap to Google Search Console: http://$Server/sitemap.xml" -ForegroundColor White
Write-Host "2. Add sitemap to Yandex Webmaster: http://$Server/sitemap.xml" -ForegroundColor White
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "robots.txt: http://$Server/robots.txt" -ForegroundColor White
Write-Host "sitemap.xml: http://$Server/sitemap.xml" -ForegroundColor White
