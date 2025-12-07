$Server = 'YOUR_SERVER_IP_HERE'
$User = 'root'
$Password = 'YOUR_PASSWORD_HERE'

$fixFileCmd = @'
cd /root/prompthub && cat > app/api/admin/impersonate/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { SignJWT } from 'jose'

type AdminResult = { ok: true; actor: { id: string; email: string | null } } | { ok: false }

async function requireAdmin(request: NextRequest): Promise<AdminResult> {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  const apiKey = process.env.ADMIN_API_KEY

  if (apiKey && header === `Bearer ${apiKey}`) {
    return { ok: true, actor: { id: 'api-key', email: 'api-key' as string | null } }
  }

  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL
  if (session?.user?.email && adminEmail && session.user.email.toLowerCase() === adminEmail.toLowerCase()) {
    return { ok: true, actor: { id: session.user.id, email: session.user.email } }
  }
  return { ok: false }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, ttlSec } = await request.json()
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const ttl = Math.min(Math.max(Number(ttlSec) || 1800, 60), 3600)
  const secret = new TextEncoder().encode(process.env.IMPERSONATION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret')

  const now = Math.floor(Date.now() / 1000)
  const exp = now + ttl

  const token = await new SignJWT({ act: admin.actor.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setSubject(userId)
    .sign(secret)

  return NextResponse.json({ token, exp })
}
EOF
'@

$buildCmd = 'cd /root/prompthub && npm run build && API_KEY=$(openssl rand -base64 32) && echo "module.exports={apps:[{name:\"prompthub\",script:\"npm\",args:\"start\",cwd:\"/root/prompthub\",env:{NODE_ENV:\"production\",PORT:3000,ADMIN_API_KEY:\"$API_KEY\",NEXTAUTH_SECRET:\"$API_KEY\"},autorestart:true}]}" > ecosystem.config.js && pm2 start ecosystem.config.js && pm2 save && sleep 8 && curl -I http://localhost:3000 && echo "KEY:$API_KEY"'

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
    
    Write-Host "Fixing TypeScript error..." -ForegroundColor Yellow
    & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fixFileCmd
    
    Write-Host "Building and starting..." -ForegroundColor Yellow
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $buildCmd
    
    Write-Host $result -ForegroundColor White
    
    if ($result -match "KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        @"
API_BASE_URL=https://prompt-hub.site
API_KEY=$apiKey
"@ | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "Config saved" -ForegroundColor Green
    }
    
    Start-Sleep 5
    try {
        $test = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 15
        Write-Host "✅ SITE IS NOW WORKING - HTTP $($test.StatusCode)" -ForegroundColor Green
        Write-Host "Site URL: https://prompt-hub.site" -ForegroundColor White
    } catch {
        Write-Host "Site may still be starting..." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
