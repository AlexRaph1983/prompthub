import { Metadata } from 'next'
import { RandomArticlesCarousel } from '@/components/articles/RandomArticlesCarousel'

export const metadata: Metadata = {
  title: 'PromptHub — библиотека и маркетплейс промптов для ИИ',
  description:
    'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.',
  keywords:
    'промпты, ИИ, ChatGPT, Claude, Gemini, нейросети, искусственный интеллект, маркетплейс',
  openGraph: {
    title: 'PromptHub — библиотека и маркетплейс промптов для ИИ',
    description:
      'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.',
    type: 'website',
    siteName: 'PromptHub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptHub — библиотека и маркетплейс промптов для ИИ',
    description:
      'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.',
  },
}

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-900">
        PromptHub — библиотека и маркетплейс промптов для ИИ
      </h1>
      <p className="text-gray-600 text-lg mb-6">
        Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки,
        рейтинги, мультиязычность. Открыто и бесплатно.
      </p>

      {/* Профессиональный блок с каруселью статей вместо старого приветственного блока */}
      <RandomArticlesCarousel locale="ru" className="mb-10" />

      <div className="text-center">
        <a
          href="/ru/home"
          className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Перейти к каталогу промптов
        </a>
      </div>
    </div>
  )
}
