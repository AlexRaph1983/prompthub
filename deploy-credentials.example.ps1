# ============================================
# DEPLOYMENT CREDENTIALS TEMPLATE
# ============================================
# 
# NEVER COMMIT THIS FILE WITH REAL CREDENTIALS!
# 
# Usage:
#   1. Copy this file to: deploy-credentials.ps1
#   2. Fill in your real credentials
#   3. Run: . .\deploy-credentials.ps1
#   4. Then run: .\deploy-prompts-prompthub5.ps1
#
# Or set environment variables directly:
#   $env:DEPLOY_SERVER = "your.server.ip"
#   $env:DEPLOY_PASSWORD = "your-password"
# ============================================

$env:DEPLOY_SERVER = "YOUR_SERVER_IP_HERE"
$env:DEPLOY_USER = "root"
$env:DEPLOY_PASSWORD = "YOUR_PASSWORD_HERE"

Write-Host "Deployment credentials loaded!" -ForegroundColor Green
Write-Host "Server: $env:DEPLOY_SERVER" -ForegroundColor Cyan
Write-Host "User: $env:DEPLOY_USER" -ForegroundColor Cyan

