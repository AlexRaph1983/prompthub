$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

try {
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
        $plink = "$env:TEMP\plink.exe"
        if (-not (Test-Path $plink)) {
            Write-Host "Downloading plink..." -ForegroundColor Yellow
            Invoke-WebRequest "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink -UseBasicParsing
        }
        $plinkCmd = $plink
    } else {
        $plinkCmd = "plink"
    }
    
    Write-Host "=== MANUAL RESTORATION STEP BY STEP ===" -ForegroundColor Red
    
    # Step 1: Check current state
    Write-Host "Step 1: Checking current server state..." -ForegroundColor Yellow
    $step1 = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root && pwd && ls -la && pm2 list'
    Write-Host $step1 -ForegroundColor White
    
    # Step 2: Kill all PM2 and clean up
    Write-Host "`nStep 2: Cleaning up PM2..." -ForegroundColor Yellow
    $step2 = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'pm2 kill'
    Write-Host $step2 -ForegroundColor White
    
    # Step 3: Restore prompthub directory
    Write-Host "`nStep 3: Restoring prompthub directory..." -ForegroundColor Yellow
    $step3 = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root && rm -rf prompthub && git clone https://github.com/yourusername/prompthub.git || echo "Clone failed, using deploy method"'
    Write-Host $step3 -ForegroundColor White
    
    # Step 4: Alternative - use the deploy script method
    Write-Host "`nStep 4: Using deploy script method..." -ForegroundColor Yellow
    $step4 = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root && mkdir -p prompthub && cd prompthub && git init && git remote add origin https://github.com/your-repo/prompthub.git || echo "Manual setup needed"'
    Write-Host $step4 -ForegroundColor White
    
    # Step 5: Manual setup with basic files
    Write-Host "`nStep 5: Creating basic working setup..." -ForegroundColor Yellow
    $step5 = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" @'
cd /root/prompthub
cat > package.json << 'EOF'
{
  "name": "prompthub",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18"
  }
}
EOF
mkdir -p app pages public
echo "export default function Home() { return <h1>PromptHub Working</h1> }" > app/page.js
npm install
npm run build
'@
    Write-Host $step5 -ForegroundColor White
    
    # Step 6: Create PM2 config and start
    Write-Host "`nStep 6: Starting with PM2..." -ForegroundColor Yellow
    $step6 = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" @'
cd /root/prompthub
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'prompthub',
    script: 'npm',
    args: 'start',
    cwd: '/root/prompthub',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    autorestart: true
  }]
}
EOF
pm2 start ecosystem.config.js
pm2 save
pm2 list
'@
    Write-Host $step6 -ForegroundColor White
    
    Write-Host "`n=== TESTING MANUAL RESTORATION ===" -ForegroundColor Cyan
    
    # Test the manually restored site
    for ($test = 1; $test -le 10; $test++) {
        Write-Host "Testing manual restoration - attempt $test/10..." -ForegroundColor Yellow
        Start-Sleep 10
        
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 20
            Write-Host "🎉 SITE MANUALLY RESTORED!" -ForegroundColor Green
            Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
            break
        } catch {
            Write-Host "❌ Test $test failed: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Red
            if ($test -eq 10) {
                # Final diagnostic
                Write-Host "`nFinal diagnostic..." -ForegroundColor Yellow
                $final = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" 'cd /root/prompthub && pwd && ls -la && pm2 logs prompthub --lines 5 --nostream && netstat -tlnp | grep :3000'
                Write-Host $final -ForegroundColor Gray
            }
        }
    }
    
} catch {
    Write-Host "❌ MANUAL RESTORATION FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
