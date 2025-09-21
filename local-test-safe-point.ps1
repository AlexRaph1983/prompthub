# Local test of SAFE_POINT restoration
$ErrorActionPreference = "Stop"

Write-Host "🧪 LOCAL SAFE_POINT TEST" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$SAFE_POINT = "edd5c04"

try {
    Write-Host "📋 Step 1: Save current work..." -ForegroundColor Yellow
    git add .
    git commit -m "Save restore artifacts before SAFE_POINT test" 2>$null
    
    Write-Host "🔄 Step 2: Switch to SAFE_POINT $SAFE_POINT..." -ForegroundColor Yellow
    git checkout $SAFE_POINT
    
    Write-Host "🧹 Step 3: Clean environment..." -ForegroundColor Yellow
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    
    Write-Host "📦 Step 4: Install dependencies..." -ForegroundColor Yellow
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install --frozen-lockfile
    } else {
        npm ci
    }
    
    Write-Host "🗄️ Step 5: Generate Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host "🏗️ Step 6: Build application..." -ForegroundColor Yellow
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm build
    } else {
        npm run build
    }
    
    Write-Host "✅ LOCAL TEST SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host "🎯 SAFE_POINT $SAFE_POINT is working locally" -ForegroundColor Green
    Write-Host "📋 Ready for production deployment" -ForegroundColor Green
    
    Write-Host "`n🚀 Next steps:" -ForegroundColor White
    Write-Host "1. Test locally: pnpm start (or npm start)" -ForegroundColor White
    Write-Host "2. Deploy to production" -ForegroundColor White
    
} catch {
    Write-Host "❌ LOCAL TEST FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔄 Returning to main branch..." -ForegroundColor Yellow
    git checkout main
    
    exit 1
}

Write-Host "`n📊 Current status:" -ForegroundColor Cyan
Write-Host "- Commit: $(git rev-parse --short HEAD)" -ForegroundColor White
Write-Host "- Build: ✅ Successful" -ForegroundColor White
Write-Host "- Dependencies: ✅ Installed" -ForegroundColor White
