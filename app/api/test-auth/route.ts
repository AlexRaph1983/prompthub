export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const session = await auth()
    console.log('Test auth - session:', session)
    
    return NextResponse.json({
      authenticated: !!session?.user?.id,
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
    })
  } catch (e) {
    console.error('Test auth error:', e)
    return NextResponse.json({ error: 'Auth error' }, { status: 500 })
  }
}
