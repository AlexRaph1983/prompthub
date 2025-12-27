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
      title: 'Prompt Catalog | PromptHub',
      robots: { index: false, follow: true }
    };
  }
  
  const title = 'Каталог промптов для ИИ — PromptHub';
  const description = 'Каталог промптов для ChatGPT, Claude, Gemini и других AI-моделей. Удобный поиск и фильтрация по категориям, тегам, моделям. Тысячи готовых промптов с описаниями и рейтингами.';
  const canonical = `${BASE_URL}/ru/katalog-promtov`;
  
  return {
    title,
    description,
    keywords: 'каталог промптов, промпты для ИИ, ChatGPT промпты, Claude промпты, Gemini промпты, база промптов, библиотека промптов, маркетплейс промптов',
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

export default async function CatalogPage({ params }: PageProps) {
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
          <h1 className="text-4xl font-bold mb-6">Каталог промптов для ИИ</h1>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Удобный каталог промптов для различных моделей искусственного интеллекта. 
            Поиск, фильтрация, категории и теги для быстрого нахождения нужных промптов.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Что такое каталог промптов?</h2>
            <p className="mb-4">
              Каталог промптов — это систематизированная коллекция промптов, организованная 
              для удобного поиска и навигации. В отличие от простого списка, каталог предоставляет 
              инструменты для фильтрации, сортировки и категоризации контента.
            </p>
            <p className="mb-4">
              Наш каталог включает тысячи промптов с удобной навигацией по категориям, тегам и моделям AI.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Особенности каталога</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Категории</strong> — промпты организованы по тематическим категориям</li>
              <li><strong>Теги</strong> — гибкая система тегов для точной фильтрации</li>
              <li><strong>Фильтры</strong> — поиск по модели AI, категории, тегам, языку</li>
              <li><strong>Сортировка</strong> — по дате, рейтингу, популярности</li>
              <li><strong>Детальная информация</strong> — описание, примеры, рейтинги для каждого промпта</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Как работать с каталогом?</h2>
            <ol className="list-decimal list-inside space-y-3 mb-4">
              <li>
                <strong>Просмотр каталога</strong> — откройте <Link href="/ru/prompts" className="text-violet-600 hover:underline">каталог промптов</Link> для просмотра всех доступных промптов
              </li>
              <li>
                <strong>Использование фильтров</strong> — сужайте результаты по категории, модели, тегам
              </li>
              <li>
                <strong>Поиск</strong> — используйте поисковую строку для поиска по названию и описанию
              </li>
              <li>
                <strong>Просмотр деталей</strong> — кликните на промпт для просмотра полной информации
              </li>
              <li>
                <strong>Копирование</strong> — скопируйте промпт одним кликом для использования
              </li>
            </ol>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Основные категории</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Link href="/ru/prompts?category=writing" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Писательство</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Тексты, статьи, контент</p>
              </Link>
              <Link href="/ru/prompts?category=coding" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Программирование</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Код, рефакторинг, отладка</p>
              </Link>
              <Link href="/ru/prompts?category=seo" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">SEO</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Оптимизация, анализ</p>
              </Link>
              <Link href="/ru/prompts?category=design" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Дизайн</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Концепции, описания</p>
              </Link>
            </div>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Как найти нужный промпт в каталоге?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Используйте поисковую строку для поиска по названию, или фильтры по категории и тегам 
                  для сужения результатов.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Можно ли сохранить промпт из каталога?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Да, вы можете скопировать промпт или сохранить его в избранное для быстрого доступа.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Как добавить свой промпт в каталог?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Зарегистрируйтесь и используйте форму добавления промпта. Укажите категорию и теги 
                  для правильной категоризации.
                </p>
              </div>
            </div>
          </section>
          
          <div className="mt-8 p-6 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Откройте каталог промптов</h2>
            <p className="mb-4">
              Перейдите в <Link href="/ru/prompts" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">каталог промптов</Link> чтобы начать поиск.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}

