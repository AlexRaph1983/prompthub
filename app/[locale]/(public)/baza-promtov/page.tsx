import { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/index';
import Link from 'next/link';
import { BASE_URL } from '@/lib/structured-data';
import { generateWebSiteSchema } from '@/lib/structured-data';

interface PageProps {
  params: { locale: Locale };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const isRu = locale === 'ru';
  
  if (!isRu) {
    return {
      title: 'Prompt Database | PromptHub',
      robots: { index: false, follow: true }
    };
  }
  
  const title = 'База промптов для ИИ — PromptHub';
  const description = 'База промптов для ChatGPT, Claude, Gemini и других AI-моделей. Тысячи готовых промптов с описаниями, категориями и тегами. Поиск и фильтрация по модели, категории, тегам.';
  const canonical = `${BASE_URL}/ru/baza-promtov`;
  
  return {
    title,
    description,
    keywords: 'база промптов, промпты для ИИ, ChatGPT промпты, Claude промпты, Gemini промпты, каталог промптов, библиотека промптов',
    alternates: {
      canonical,
      languages: {
        ru: canonical,
        'x-default': canonical
      }
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'PromptHub',
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/og/prompt-hub-ru.png`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og/prompt-hub-ru.png`]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function DatabasePage({ params }: PageProps) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  
  if (locale !== 'ru') {
    return null;
  }
  
  const structuredData = generateWebSiteSchema('ru');
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-6">База промптов для ИИ</h1>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Структурированная база данных промптов для различных моделей искусственного интеллекта. 
            Тысячи готовых решений с детальными описаниями, категориями и системой поиска.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Что такое база промптов?</h2>
            <p className="mb-4">
              База промптов — это систематизированная коллекция промптов для AI-моделей, 
              организованная по категориям, тегам и моделям. Каждый промпт содержит описание, 
              инструкции по использованию и метаданные для удобного поиска.
            </p>
            <p className="mb-4">
              Наша база постоянно пополняется новыми промптами, проверенными сообществом пользователей.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Преимущества нашей базы промптов</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Структурированная организация</strong> — промпты распределены по категориям и тегам</li>
              <li><strong>Мощный поиск</strong> — найдите нужный промпт по ключевым словам, категории или модели AI</li>
              <li><strong>Детальные описания</strong> — каждый промпт содержит описание назначения и инструкции</li>
              <li><strong>Рейтинги и отзывы</strong> — узнайте мнение других пользователей о качестве промптов</li>
              <li><strong>Регулярные обновления</strong> — база постоянно пополняется новыми промптами</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Как использовать базу промптов?</h2>
            <ol className="list-decimal list-inside space-y-3 mb-4">
              <li>
                <strong>Поиск</strong> — используйте <Link href="/ru/prompts" className="text-violet-600 hover:underline">поиск по каталогу</Link> для нахождения нужных промптов
              </li>
              <li>
                <strong>Фильтрация</strong> — сужайте результаты по категории, модели AI, тегам
              </li>
              <li>
                <strong>Просмотр</strong> — изучите описание, примеры использования и отзывы
              </li>
              <li>
                <strong>Копирование</strong> — скопируйте промпт и адаптируйте под свои задачи
              </li>
              <li>
                <strong>Сохрание</strong> — сохраняйте полезные промпты в избранное для быстрого доступа
              </li>
            </ol>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Поддерживаемые модели AI</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">ChatGPT</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">OpenAI GPT-4, GPT-3.5</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Claude</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anthropic Claude 3.5</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Gemini</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Google Gemini Pro</p>
              </div>
            </div>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Сколько промптов в базе?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  База содержит тысячи промптов и постоянно растет благодаря вкладу сообщества.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Как добавить свой промпт в базу?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Зарегистрируйтесь на платформе и опубликуйте свой промпт через форму добавления.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Все ли промпты бесплатны?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Большинство промптов доступны бесплатно. Лицензия каждого промпта указана на его странице.
                </p>
              </div>
            </div>
          </section>
          
          <div className="mt-8 p-6 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Изучите базу промптов</h2>
            <p className="mb-4">
              Перейдите в <Link href="/ru/prompts" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">каталог промптов</Link> чтобы начать поиск готовых решений.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}

