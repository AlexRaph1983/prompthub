"use client"

export const dynamic = 'force-dynamic'

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-md bg-white">
        <h1 className="text-xl font-semibold mb-4">Вход</h1>
        <p className="text-sm text-gray-500 mb-6">Войдите через Google</p>
        <Button className="w-full" onClick={() => signIn('google', { callbackUrl: '/' })}>
          Войти через Google
        </Button>
      </div>
    </main>
  )
}


