import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

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