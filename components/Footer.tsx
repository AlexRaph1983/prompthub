'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Footer() {
  const t = useTranslations('footer')
  const params = useParams()
  const locale = params.locale as string || 'ru'

  useEffect(() => {
    // LiveInternet counter script
    const img = document.getElementById('licntC9DE')
    if (img) {
      img.setAttribute('src', 
        "https://counter.yadro.ru/hit?t45.5;r" + escape(document.referrer) +
        ((typeof screen == "undefined") ? "" : ";s" + screen.width + "*" + screen.height + "*" +
        (screen.colorDepth ? screen.colorDepth : screen.pixelDepth)) + ";u" + escape(document.URL) +
        ";h" + escape(document.title.substring(0, 150)) + ";" + Math.random()
      )
    }
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* О проекте */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">PromptHub</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('about')}
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h4 className="text-white font-medium mb-4">{t('navigation')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-sm hover:text-violet-400 transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/prompts`} className="text-sm hover:text-violet-400 transition-colors">
                  {t('prompts')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/leaders`} className="text-sm hover:text-violet-400 transition-colors">
                  {t('leaders')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Правовая информация */}
          <div>
            <h4 className="text-white font-medium mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/privacy`} className="text-sm hover:text-violet-400 transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('cookie-consent')
                      localStorage.removeItem('analytics-consent')
                      window.location.reload()
                    }
                  }}
                  className="text-sm hover:text-violet-400 transition-colors text-left"
                >
                  {t('cookieSettings')}
                </button>
              </li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-white font-medium mb-4">{t('contact')}</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:privacy@prompt-hub.site" 
                  className="text-sm hover:text-violet-400 transition-colors"
                >
                  privacy@prompt-hub.site
                </a>
              </li>
            </ul>
            {/* LiveInternet counter */}
            <div className="mt-4">
              <a 
                href="https://www.liveinternet.ru/click"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img 
                  id="licntC9DE" 
                  width="31" 
                  height="31" 
                  style={{ border: 0 }} 
                  title="LiveInternet"
                  src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7"
                  alt=""
                />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} PromptHub. {t('rights')}
          </p>
          <p className="text-xs text-gray-500">
            {t('compliance')}
          </p>
        </div>
      </div>
    </footer>
  )
}

