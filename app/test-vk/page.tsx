'use client'

import { signIn, useSession } from 'next-auth/react'
import { VKIDButton } from '@/components/VKIDButton'

export default function TestVKPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Загрузка...</div>
  }

  if (session) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Авторизация успешна!</h1>
        <div className="space-y-2">
          <p><strong>ID:</strong> {session.user?.id}</p>
          <p><strong>Имя:</strong> {session.user?.name}</p>
          <p><strong>Email:</strong> {session.user?.email}</p>
          {session.user?.image && (
            <div>
              <strong>Аватар:</strong>
              <img src={session.user.image} alt="Avatar" className="w-16 h-16 rounded-full mt-2" />
            </div>
          )}
        </div>
        <button
          onClick={() => signIn()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Выйти
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Тест VK авторизации</h1>
      <div className="space-y-4">
        <VKIDButton />
        <button
          onClick={() => signIn('google')}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Войти через Google
        </button>
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Переменные окружения:</h3>
        <p>VK_CLIENT_ID: {process.env.NEXT_PUBLIC_VK_CLIENT_ID ? '✅ Настроен' : '❌ Не настроен'}</p>
        <p>NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL ? '✅ Настроен' : '❌ Не настроен'}</p>
      </div>
    </div>
  )
}
