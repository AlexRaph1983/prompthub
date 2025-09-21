$Server = '83.166.244.71'
$User = 'root'
$Password = 'yqOdhMhP41s5827h'

$fixFileScript = @'
cd /root/prompthub
cat > app/api/admin/impersonate/route.ts << 'ENDFILE'
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
ENDFILE

npm run build
API_KEY=$(openssl rand -base64 32)
export ADMIN_API_KEY=$API_KEY
export NEXTAUTH_SECRET=$API_KEY
export NODE_ENV=production
pm2 start npm --name prompthub -- start
pm2 save
sleep 20
pm2 list
netstat -tlnp | grep :3000
curl -sI http://localhost:3000
echo "FINAL_API_KEY:$API_KEY"
'@

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
    
    Write-Host "FIXING FILE AND RESTARTING..." -ForegroundColor Cyan
    $result = & $plinkCmd -ssh -pw $Password -batch "$User@$Server" $fixFileScript
    Write-Host $result -ForegroundColor White
    
    if ($result -match "FINAL_API_KEY:(.+)") {
        $apiKey = $matches[1].Trim()
        "API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
        Write-Host "✅ API key saved" -ForegroundColor Green
    }
    
    Write-Host "`nTESTING FINAL RESULT..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le 20; $i++) {
        Start-Sleep 15
        try {
            $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
            Write-Host "🎉 SUCCESS! SITE FULLY WORKING - Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "🌐 Site: https://prompt-hub.site" -ForegroundColor White
            Write-Host "🔧 Uploader: D:\BulkPromptUploader" -ForegroundColor White
            break
        } catch {
            Write-Host "Test $i: Still starting..." -ForegroundColor Yellow
            if ($i -eq 20) {
                Write-Host "Final check..." -ForegroundColor Red
                try {
                    $direct = Invoke-WebRequest "http://83.166.244.71:3000" -UseBasicParsing -TimeoutSec 15
                    Write-Host "Direct access works: $($direct.StatusCode)" -ForegroundColor Green
                } catch {
                    Write-Host "No response from server" -ForegroundColor Red
                }
            }
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
