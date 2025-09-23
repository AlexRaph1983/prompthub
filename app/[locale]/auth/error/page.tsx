"use client"

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
  const params = useSearchParams()
  const error = params.get('error')

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border p-6 shadow-md bg-white">
        <h1 className="text-xl font-semibold mb-2">Ошибка авторизации</h1>
        <p className="text-sm text-gray-600 mb-4">{error || 'Неизвестная ошибка.'}</p>
        <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1 mb-4">
          <li>Проверьте, что заданы переменные окружения GOOGLE_CLIENT_ID/SECRET</li>
          <li>Проверьте NEXTAUTH_URL и домен в Google OAuth (Authorized redirect URI)</li>
          <li>URI должен быть вида: https://prompt-hub.site/api/auth/callback/google</li>
        </ul>
        <div className="flex gap-3">
          <Link href="/ru/auth/signin" className="text-violet-600 hover:underline">Повторить вход</Link>
          <Link href="/" className="text-gray-600 hover:underline">На главную</Link>
        </div>
      </div>
    </main>
  )
}


