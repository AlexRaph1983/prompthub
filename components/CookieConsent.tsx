'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { X, Cookie, Settings } from 'lucide-react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'cookie-consent'
const ANALYTICS_CONSENT_KEY = 'analytics-consent'

interface ConsentState {
  necessary: boolean
  analytics: boolean
  timestamp: number
}

export default function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(true)

  useEffect(() => {
    // Проверяем, есть ли уже согласие
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Показываем баннер с небольшой задержкой для лучшего UX
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      // Если есть согласие, применяем настройки аналитики
      const analyticsEnabled = localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'
      applyAnalyticsConsent(analyticsEnabled)
    }
  }, [])

  const applyAnalyticsConsent = (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      if (enabled) {
        // Включаем Яндекс.Метрику
        if (window.ym) {
          window.ym(104142063, 'init', { 
            ssr: true, 
            webvisor: true, 
            clickmap: true, 
            ecommerce: "dataLayer", 
            accurateTrackBounce: true, 
            trackLinks: true 
          })
        }
      } else {
        // Отключаем аналитику
        if (window.ym) {
          window.ym(104142063, 'notBounce')
        }
      }
    }
  }

  const saveConsent = (acceptAnalytics: boolean) => {
    const consent: ConsentState = {
      necessary: true, // Всегда true для технических cookie
      analytics: acceptAnalytics,
      timestamp: Date.now()
    }
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
    localStorage.setItem(ANALYTICS_CONSENT_KEY, String(acceptAnalytics))
    
    // Применяем настройки аналитики
    applyAnalyticsConsent(acceptAnalytics)
    
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleAcceptAll = () => {
    saveConsent(true)
  }

  const handleRejectAnalytics = () => {
    saveConsent(false)
  }

  const handleSaveSettings = () => {
    saveConsent(analyticsConsent)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Основной баннер */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-violet-500 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Cookie className="w-6 h-6 text-violet-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('title')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('description')}{' '}
                <Link href="/ru/privacy" className="text-violet-600 hover:text-violet-700 underline">
                  {t('privacyPolicyLink')}
                </Link>
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  size="sm"
                >
                  {t('acceptAll')}
                </Button>
                
                <Button
                  onClick={handleRejectAnalytics}
                  variant="outline"
                  size="sm"
                >
                  {t('rejectAnalytics')}
                </Button>
                
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('customize')}
                </Button>
              </div>
            </div>
            
            <button
              onClick={() => setShowBanner(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно настроек */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('settingsTitle')}</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={t('close')}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Необходимые cookie */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('necessary.title')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('necessary.description')}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded">
                        {t('alwaysActive')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Аналитические cookie */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('analytics.title')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {t('analytics.description')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('analytics.tools')}: Яндекс.Метрика
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setAnalyticsConsent(!analyticsConsent)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          analyticsConsent ? 'bg-violet-600' : 'bg-gray-200'
                        }`}
                        role="switch"
                        aria-checked={analyticsConsent}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            analyticsConsent ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Информация о cookie */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">{t('moreInfo')}</h4>
                  <p className="text-sm text-blue-800">
                    {t('moreInfoText')}{' '}
                    <Link href="/ru/privacy" className="underline hover:text-blue-900">
                      {t('privacyPolicyLink')}
                    </Link>
                  </p>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {t('saveSettings')}
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Расширяем Window type для Яндекс.Метрики
declare global {
  interface Window {
    ym?: (id: number, method: string, params?: any) => void
  }
}

