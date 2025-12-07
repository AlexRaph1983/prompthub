$Server = 'YOUR_SERVER_IP_HERE'
$User = 'root'
$Password = 'YOUR_PASSWORD_HERE'

# Single line commands to avoid formatting issues
$commands = @(
    'cd /root/prompthub',
    'pm2 kill || true',
    'systemctl restart nginx',
    'git reset --hard origin/main || true',
    'rm -rf node_modules .next',
    'npm install',
    'npm run build',
    'API_KEY=$(openssl rand -base64 32)',
    'echo "module.exports={apps:[{name:\"prompthub\",script:\"npm\",args:\"start\",cwd:\"/root/prompthub\",env:{NODE_ENV:\"production\",PORT:3000,ADMIN_API_KEY:\"$API_KEY\",NEXTAUTH_SECRET:\"$API_KEY\"},autorestart:true}]}" > ecosystem.config.js',
    'pm2 start ecosystem.config.js',
    'pm2 save',
    'sleep 10',
    'curl -I http://localhost:3000',
    'echo "API_KEY:$API_KEY"'
)

$fullCommand = $commands -join ' && '

try {
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        $plink = "$env:TEMP\plink.exe"
        Invoke-WebRequest "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink -UseBasicParsing
        $plinkCmd = $plink
    } else {
        $plinkCmd = "plink"
    }
    
    Write-Host "Restoring site..." -ForegroundColor Yellow
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fullCommand
    
    Write-Host $result -ForegroundColor White
    
    # Extract API key
    if ($result -match "API_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        @"
API_BASE_URL=https://prompt-hub.site
API_KEY=$apiKey
"@ | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "Updated uploader config" -ForegroundColor Green
    }
    
    # Test site
    Start-Sleep 5
    try {
        $test = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 20
        Write-Host "✅ SITE RESTORED SUCCESSFULLY - Status: $($test.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Site may need more time to start" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
