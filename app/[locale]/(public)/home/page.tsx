export const dynamic = 'force-dynamic'

import HomePage from '@/components/pages/HomePage'
import { generateHomeMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/index'

interface PageProps {
  params: { locale: Locale }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'
  
  // Обновляем title для RU с целевыми запросами
  const metadata = generateHomeMetadata(locale, baseUrl)
  
  if (locale === 'ru') {
    metadata.title = 'PromptHub — маркетплейс промптов, библиотека и база промптов для ИИ'
    metadata.description = 'Маркетплейс и библиотека промптов для ChatGPT, Claude, Gemini и других ИИ. Находите, публикуйте и используйте лучшие промпты. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.'
    metadata.keywords = 'маркетплейс промптов, база промптов, каталог промптов, библиотека промптов, промпты для ИИ, ChatGPT, Claude, Gemini'
  }
  
  // Обновляем canonical и hreflang
  metadata.alternates = {
    canonical: `${baseUrl}/${locale}/home`,
    languages: {
      ru: `${baseUrl}/ru/home`,
      en: `${baseUrl}/en/home`,
      'x-default': `${baseUrl}/ru/home`
    }
  }
  
  return metadata
}

export default function Page() {
  return <HomePage />
}


