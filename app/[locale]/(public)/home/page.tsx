export const dynamic = 'force-dynamic'

import HomePage from '@/components/pages/HomePage'
import { generateHomeMetadata } from '@/lib/seo'
import { generateWebSiteSchema } from '@/lib/structured-data'
import type { Metadata } from 'next'
import type { Locale } from '@/i18n/index'

interface PageProps {
  params: { locale: Locale }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'
  const canonicalLocale: Locale = 'ru'
  
  // Обновляем title для RU с целевыми запросами
  const metadata = generateHomeMetadata(locale, baseUrl)
  
  if (locale === 'ru') {
    metadata.title = 'PromptHub — маркетплейс промптов, библиотека и база промптов для ИИ'
    metadata.description = 'Маркетплейс и библиотека промптов для ChatGPT, Claude, Gemini и других ИИ. Находите, публикуйте и используйте лучшие промпты. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.'
    metadata.keywords = 'маркетплейс промптов, база промптов, каталог промптов, библиотека промптов, промпты для ИИ, ChatGPT, Claude, Gemini'
  }
  
  // Обновляем canonical
  const canonical = `${baseUrl}/${canonicalLocale}/home`
  metadata.alternates = { canonical }
  metadata.openGraph = {
    ...metadata.openGraph,
    url: canonical,
    locale: 'ru_RU'
  }
  metadata.robots = {
    index: locale === canonicalLocale,
    follow: true
  }
  
  return metadata
}

export default function Page({ params }: PageProps) {
  const canonicalLocale: Locale = 'ru'
  const structuredData = generateWebSiteSchema(canonicalLocale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePage />
    </>
  )
}


