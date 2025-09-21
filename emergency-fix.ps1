$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

# Fixed script without line ending issues
$fixScript = 'cd /root/prompthub && echo "Starting emergency fix..." && pm2 kill && systemctl restart nginx && rm -rf node_modules .next && npm install --production && npm run build && API_KEY=$(openssl rand -base64 32) && export ADMIN_API_KEY=$API_KEY && export NEXTAUTH_SECRET=$API_KEY && export NODE_ENV=production && export PORT=3000 && pm2 start npm --name prompthub -- start && pm2 save && sleep 15 && pm2 list && netstat -tlnp | grep :3000 && curl -I http://localhost:3000 && echo "API_KEY: $API_KEY"'

try {
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        $plink = "$env:TEMP\plink.exe"
        if (-not (Test-Path $plink)) {
            Invoke-WebRequest "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink -UseBasicParsing
        }
        $plinkCmd = $plink
    } else {
        $plinkCmd = "plink"
    }
    
    Write-Host "=== EMERGENCY SITE RESTORATION ===" -ForegroundColor Red
    Write-Host "Executing comprehensive fix..." -ForegroundColor Yellow
    
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fixScript
    Write-Host $result -ForegroundColor White
    
    # Extract and save API key
    if ($result -match "API_KEY: (.+)") {
        $apiKey = $matches[1].Trim()
        @"
API_BASE_URL=https://prompt-hub.site
API_KEY=$apiKey
"@ | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "✅ API key saved: $($apiKey.Substring(0,8))..." -ForegroundColor Green
    }
    
    Write-Host "`n=== VERIFYING SITE STATUS ===" -ForegroundColor Cyan
    
    # Multiple verification attempts
    $verified = $false
    for ($attempt = 1; $attempt -le 8; $attempt++) {
        Write-Host "Verification attempt $attempt/8..." -ForegroundColor Yellow
        Start-Sleep 5
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 15
            Write-Host "✅ SUCCESS! Site restored - HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site accessible at: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔧 Bulk uploader ready at: D:\BulkPromptUploader" -ForegroundColor White
            $verified = $true
            break
        } catch {
            Write-Host "❌ Attempt $attempt failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    if (-not $verified) {
        Write-Host "⚠️ Testing direct server access..." -ForegroundColor Yellow
        try {
            $directResponse = Invoke-WebRequest "http://83.166.244.71:3000" -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ Direct server works - Status: $($directResponse.StatusCode)" -ForegroundColor Green
            Write-Host "❌ Domain/Nginx issue detected" -ForegroundColor Red
        } catch {
            Write-Host "❌ Server still not responding" -ForegroundColor Red
            
            # Final diagnostic
            Write-Host "Running final diagnostic..." -ForegroundColor Yellow
            $diagnostic = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && pm2 logs prompthub --lines 10 --nostream && pm2 list && netstat -tlnp | grep :3000'
            Write-Host $diagnostic -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ CRITICAL ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
