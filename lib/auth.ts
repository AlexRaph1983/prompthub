import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export const auth = async () => {
  // Отключаем заглушку. Включаем тестовую сессию только если явно задано AUTH_FORCE_TEST=1
  if (process.env.AUTH_FORCE_TEST === '1') {
    console.warn('[auth] AUTH_FORCE_TEST=1 → возвращаем тестовую сессию')
    return {
      user: {
        id: 'test-user-2',
        name: 'Test Rater',
        email: 'rater@example.com',
      }
    }
  }

  try {
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Расширенная аутентификация: поддерживает Authorization: Bearer <impersonation_jwt>
 * Если Bearer-токен валиден, возвращает сессию с user.id = sub
 * Иначе — пытается получить обычную сессию NextAuth
 */
export const authFromRequest = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length).trim()
    : null

  // 1) Пытаемся проверить Bearer-токен имперсонации
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.IMPERSONATION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret')
      const { payload } = await jwtVerify(token, secret)
      if (payload?.sub) {
        return {
          user: {
            id: String(payload.sub),
            name: undefined,
            email: undefined,
          },
          impersonated: true,
          actorId: payload['act'] ? String(payload['act']) : undefined,
        } as any
      }
    } catch (e) {
      // Падаем обратно на NextAuth
      console.warn('[authFromRequest] Bearer verification failed, fallback to NextAuth')
    }
  }

  // 2) Fallback: обычная сессия
  try {
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.error('Auth error (fallback):', error)
    return null
  }
}