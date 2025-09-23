import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey || adminKey !== (process.env.ADMIN_API_KEY || process.env.NEXTAUTH_SECRET)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const NEXTAUTH_URL = process.env.NEXTAUTH_URL
  const NEXTAUTH_SECRET = Boolean(process.env.NEXTAUTH_SECRET)
  const GOOGLE_CLIENT_ID = Boolean(process.env.GOOGLE_CLIENT_ID)
  const GOOGLE_CLIENT_SECRET = Boolean(process.env.GOOGLE_CLIENT_SECRET)

  const expectedCallback = (NEXTAUTH_URL?.replace(/\/$/, '') || 'https://prompt-hub.site') + '/api/auth/callback/google'

  return NextResponse.json({
    ok: true,
    env: {
      NEXTAUTH_URL,
      NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
    },
    expectedCallback,
  })
}


