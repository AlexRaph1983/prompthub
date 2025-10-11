import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PromptHub — библиотека и маркетплейс промптов для ИИ',
  description: 'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.',
  keywords: 'промпты, ИИ, ChatGPT, Claude, Gemini, нейросети, искусственный интеллект, маркетплейс',
  openGraph: {
    title: 'PromptHub — библиотека и маркетплейс промптов для ИИ',
    description: 'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.',
    type: 'website',
    siteName: 'PromptHub'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptHub — библиотека и маркетплейс промптов для ИИ',
    description: 'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.'
  }
}

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-900">PromptHub — библиотека и маркетплейс промптов для ИИ</h1>
      <p className="text-gray-600 text-lg mb-6">Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.</p>
      
      {/* Дополнительный контент для SEO */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
        <div className="prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Добро пожаловать в PromptHub
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            PromptHub — это крупнейшая библиотека готовых решений и шаблонов для работы с искусственным интеллектом. 
            Здесь вы найдете проверенные промпты для ChatGPT, Claude, Midjourney и других популярных ИИ-инструментов.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                🎯 Готовые решения
              </h3>
              <p className="text-sm text-gray-600">
                Тысячи проверенных шаблонов для любых задач
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ⚡ Быстрый поиск
              </h3>
              <p className="text-sm text-gray-600">
                Найдите нужное решение за секунды
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                🔧 Адаптация
              </h3>
              <p className="text-sm text-gray-600">
                Легко настройте под свои потребности
              </p>
            </div>
          </div>
        </div>
      </div>
      
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