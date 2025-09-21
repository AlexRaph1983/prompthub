Param(
  [switch]$SkipImport
)

$ErrorActionPreference = "Stop"

Write-Host "🔒 Creating local backups before import..." -ForegroundColor Cyan

$root = (Resolve-Path "..").Path
$prismaDir = Join-Path $root "prisma"
$dbFile = Join-Path $prismaDir "dev.db"
$backupDir = Join-Path $prismaDir ("backups/" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (Test-Path $dbFile) {
  Copy-Item $dbFile (Join-Path $backupDir "dev.db")
  Write-Host "✅ SQLite DB backed up to $backupDir" -ForegroundColor Green
} else {
  Write-Host "ℹ️ No local SQLite DB found at $dbFile (first run?)" -ForegroundColor Yellow
}

$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
  Copy-Item $envFile (Join-Path $backupDir ".env.backup")
}
$envProd = Join-Path $root ".env.production"
if (Test-Path $envProd) {
  Copy-Item $envProd (Join-Path $backupDir ".env.production.backup")
}
Write-Host "✅ Env files snapshot saved" -ForegroundColor Green

if ($SkipImport) { exit 0 }

Write-Host "📥 Running PromptMaster import (idempotent upsert)..." -ForegroundColor Cyan

Push-Location $root
try {
  if (Test-Path "pnpm-lock.yaml") {
    pnpm tsx scripts/add-promptmaster-prompts.ts
  } else {
    npx tsx scripts/add-promptmaster-prompts.ts
  }
  Write-Host "🎉 Import complete" -ForegroundColor Green
} finally {
  Pop-Location
}


