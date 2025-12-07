# Script to clean hardcoded credentials from all files
# Run this BEFORE using BFG to clean git history

$ErrorActionPreference = "Stop"

$projectRoot = "D:\PromptHub"
$oldPassword = "YOUR_PASSWORD_HERE"
$oldIP = "YOUR_SERVER_IP_HERE"
$newPassword = "YOUR_PASSWORD_HERE"
$newIP = "YOUR_SERVER_IP_HERE"

Write-Host "=== Cleaning credentials from project files ===" -ForegroundColor Yellow

# Get all text files (exclude .git, node_modules, etc.)
$excludeDirs = @(".git", "node_modules", ".next", "dist", "build", ".cache")
$extensions = @("*.ps1", "*.sh", "*.bat", "*.md", "*.txt", "*.js", "*.ts", "*.json")

$files = Get-ChildItem -Path $projectRoot -Recurse -File -Include $extensions | 
    Where-Object { 
        $path = $_.FullName
        -not ($excludeDirs | Where-Object { $path -like "*\$_\*" })
    }

$modifiedCount = 0

foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($null -eq $content) { continue }
        
        $newContent = $content
        $modified = $false
        
        if ($content -match [regex]::Escape($oldPassword)) {
            $newContent = $newContent -replace [regex]::Escape($oldPassword), $newPassword
            $modified = $true
        }
        
        if ($content -match [regex]::Escape($oldIP)) {
            $newContent = $newContent -replace [regex]::Escape($oldIP), $newIP
            $modified = $true
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "  Modified: $($file.FullName)" -ForegroundColor Green
            $modifiedCount++
        }
    } catch {
        Write-Host "  Error processing: $($file.FullName) - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Cleaning complete ===" -ForegroundColor Yellow
Write-Host "Modified $modifiedCount files" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes: git diff" -ForegroundColor White
Write-Host "2. Commit: git add -A && git commit -m 'security: remove hardcoded credentials'" -ForegroundColor White
Write-Host "3. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor White
Write-Host "4. Run BFG to clean history" -ForegroundColor White

