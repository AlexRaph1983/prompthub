import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { userId, userName } = await request.json()
    
    // Создаем простую тестовую сессию
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', 'test-session-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return NextResponse.json({
      success: true,
      userId,
      userName,
    })
  } catch (e) {
    console.error('Test login error:', e)
    return NextResponse.json({ error: 'Login error' }, { status: 500 })
  }
}
