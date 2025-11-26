"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { signIn } from "next-auth/react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import PrivacyCheckbox from '@/components/PrivacyCheckbox'

export default function SignInPage() {
  const t = useTranslations('auth')
  const params = useParams()
  const locale = params.locale as string || 'ru'
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    if (!privacyConsent) {
      setShowError(true)
      return
    }
    
    setShowError(false)
    setIsLoading(true)
    
    try {
      // Сохраняем согласие в localStorage перед авторизацией
      if (typeof window !== 'undefined') {
        localStorage.setItem('privacy-consent', JSON.stringify({
          timestamp: Date.now(),
          accepted: true
        }))
      }
      
      await signIn('google', { callbackUrl: `/${locale}` })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-violet-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('signIn')}</h1>
          <p className="text-gray-600">{t('signInSubtitle')}</p>
        </div>
        
        <div className="space-y-6">
          {/* Чекбокс согласия на обработку ПД */}
          <PrivacyCheckbox
            checked={privacyConsent}
            onChange={setPrivacyConsent}
            locale={locale}
            error={showError}
          />
          
          {/* Кнопка входа через Google */}
          <Button 
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('loading')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{t('signInGoogle')}</span>
              </div>
            )}
          </Button>

          {/* Дополнительная информация */}
          <p className="text-xs text-center text-gray-500 leading-relaxed">
            {t('termsNotice')}
          </p>
        </div>
      </div>
    </main>
  )
}
