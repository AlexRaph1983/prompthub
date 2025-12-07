$Server = 'YOUR_SERVER_IP_HERE'
$User = 'root'
$Password = 'YOUR_PASSWORD_HERE'

$cmd = 'cd /root/prompthub && pm2 stop all && pm2 delete all && API_KEY=$(openssl rand -base64 32) && export ADMIN_API_KEY=$API_KEY && export NEXTAUTH_SECRET=$API_KEY && pm2 start npm --name prompthub -- start && pm2 save && sleep 10 && curl -I http://localhost:3000 && echo "KEY:$API_KEY"'

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
    
    Write-Host "Final restoration..." -ForegroundColor Yellow
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $cmd
    Write-Host $result -ForegroundColor White
    
    if ($result -match "KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "API key saved: $apiKey" -ForegroundColor Green
    }
    
    Write-Host "Testing..." -ForegroundColor Yellow
    Start-Sleep 8
    
    try {
        $test = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 20
        Write-Host "SUCCESS! Site working - Status: $($test.StatusCode)" -ForegroundColor Green
        Write-Host "Site: https://prompt-hub.site" -ForegroundColor White
        Write-Host "Uploader: D:\BulkPromptUploader" -ForegroundColor White
    } catch {
        Write-Host "Site may need more time..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
