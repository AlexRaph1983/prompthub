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
      title: 'Prompt Library | PromptHub',
      robots: { index: false, follow: true }
    };
  }
  
  const title = 'Библиотека промптов для ИИ — PromptHub';
  const description = 'Библиотека промптов для ChatGPT, Claude, Gemini и других AI-моделей. Коллекция проверенных промптов с описаниями, категориями и инструкциями по использованию. Открытый доступ к промптам.';
  const canonical = `${BASE_URL}/ru/biblioteka-promtov`;
  
  return {
    title,
    description,
    keywords: 'библиотека промптов, промпты для ИИ, ChatGPT промпты, Claude промпты, Gemini промпты, каталог промптов, база промптов, маркетплейс промптов',
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

export default async function LibraryPage({ params }: PageProps) {
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
          <h1 className="text-4xl font-bold mb-6">Библиотека промптов для ИИ</h1>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Открытая библиотека промптов для различных моделей искусственного интеллекта. 
            Коллекция проверенных и протестированных промптов с подробными описаниями и инструкциями.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Что такое библиотека промптов?</h2>
            <p className="mb-4">
              Библиотека промптов — это коллекция готовых промптов для AI-моделей, организованная 
              для удобного доступа и использования. В отличие от простого списка, библиотека 
              предоставляет структурированный доступ к проверенному контенту.
            </p>
            <p className="mb-4">
              Наша библиотека содержит тысячи промптов, проверенных сообществом, с детальными 
              описаниями и примерами использования.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Преимущества библиотеки</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Проверенный контент</strong> — промпты проверены и оценены сообществом</li>
              <li><strong>Подробные описания</strong> — каждый промпт содержит описание назначения</li>
              <li><strong>Примеры использования</strong> — инструкции по применению промптов</li>
              <li><strong>Категоризация</strong> — удобная организация по категориям и тегам</li>
              <li><strong>Открытый доступ</strong> — большинство промптов доступны бесплатно</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Как использовать библиотеку?</h2>
            <ol className="list-decimal list-inside space-y-3 mb-4">
              <li>
                <strong>Просмотр</strong> — откройте <Link href="/ru/prompts" className="text-violet-600 hover:underline">каталог промптов</Link> для просмотра библиотеки
              </li>
              <li>
                <strong>Поиск</strong> — используйте поиск для нахождения промптов по ключевым словам
              </li>
              <li>
                <strong>Фильтрация</strong> — сужайте результаты по категории, модели, тегам
              </li>
              <li>
                <strong>Изучение</strong> — читайте описания и инструкции перед использованием
              </li>
              <li>
                <strong>Копирование</strong> — скопируйте промпт и адаптируйте под свои нужды
              </li>
            </ol>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Категории в библиотеке</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Link href="/ru/prompts?category=writing" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Писательство и контент</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для создания текстов</p>
              </Link>
              <Link href="/ru/prompts?category=coding" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Программирование</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для разработки</p>
              </Link>
              <Link href="/ru/prompts?category=seo" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">SEO и маркетинг</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для оптимизации</p>
              </Link>
              <Link href="/ru/prompts?category=design" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Дизайн</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для дизайна</p>
              </Link>
            </div>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Бесплатна ли библиотека?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Большинство промптов в библиотеке доступны бесплатно. Каждый промпт имеет указанную лицензию.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Как часто обновляется библиотека?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Библиотека постоянно пополняется новыми промптами от пользователей сообщества.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Могу ли я внести свой вклад?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Да, вы можете добавить свои промпты в библиотеку, зарегистрировавшись на платформе.
                </p>
              </div>
            </div>
          </section>
          
          <div className="mt-8 p-6 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Изучите библиотеку промптов</h2>
            <p className="mb-4">
              Перейдите в <Link href="/ru/prompts" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">каталог промптов</Link> чтобы открыть библиотеку.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}

