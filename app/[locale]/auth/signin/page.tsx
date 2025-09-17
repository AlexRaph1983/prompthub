"use client"

import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  const t = useTranslations()
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-md bg-white">
        <h1 className="text-xl font-semibold mb-4">{t('auth.signInTitle', { fallback: 'Вход' })}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('auth.signInSubtitle', { fallback: 'Войдите через Google' })}</p>
        <Button className="w-full" onClick={() => signIn('google', { callbackUrl: '/' })}>
          {t('auth.signInWithGoogle', { fallback: 'Войти через Google' })}
        </Button>
      </div>
    </main>
  )
}


