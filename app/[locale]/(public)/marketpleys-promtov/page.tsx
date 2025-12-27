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
    // EN версия редиректит на главную или не существует
    return {
      title: 'Prompt Marketplace | PromptHub',
      robots: { index: false, follow: true }
    };
  }
  
  const title = 'Маркетплейс промптов для ИИ — PromptHub';
  const description = 'Маркетплейс промптов для ChatGPT, Claude, Gemini и других ИИ-моделей. Находите готовые решения, публикуйте свои промпты, получайте отзывы и рейтинги. Открытая платформа для обмена промптами.';
  const canonical = `${BASE_URL}/ru/marketpleys-promtov`;
  
  return {
    title,
    description,
    keywords: 'маркетплейс промптов, промпты для ИИ, ChatGPT промпты, Claude промпты, Gemini промпты, база промптов, каталог промптов',
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

export default async function MarketplacePage({ params }: PageProps) {
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
          <h1 className="text-4xl font-bold mb-6">Маркетплейс промптов для ИИ</h1>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Открытая платформа для обмена промптами для искусственного интеллекта. 
            Находите готовые решения, публикуйте свои промпты, получайте отзывы и рейтинги от сообщества.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Что такое маркетплейс промптов?</h2>
            <p className="mb-4">
              Маркетплейс промптов — это платформа, где пользователи могут находить, 
              публиковать и обмениваться промптами для различных AI-моделей: ChatGPT, Claude, Gemini и других.
            </p>
            <p className="mb-4">
              В отличие от обычной библиотеки, маркетплейс предоставляет возможность оценки, 
              комментирования и улучшения промптов силами сообщества.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Кому подходит маркетплейс промптов?</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Разработчикам и программистам</strong> — готовые промпты для автоматизации задач</li>
              <li><strong>Контент-менеджерам</strong> — шаблоны для создания текстов, статей, описаний</li>
              <li><strong>Маркетологам</strong> — промпты для SEO, рекламных текстов, анализа данных</li>
              <li><strong>Исследователям</strong> — специализированные промпты для работы с данными</li>
              <li><strong>Студентам и преподавателям</strong> — образовательные промпты и шаблоны</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Как пользоваться маркетплейсом?</h2>
            <ol className="list-decimal list-inside space-y-3 mb-4">
              <li>
                <strong>Поиск промптов</strong> — используйте <Link href="/ru/prompts" className="text-violet-600 hover:underline">каталог промптов</Link> для поиска по категориям, тегам и моделям AI
              </li>
              <li>
                <strong>Оценка и отзывы</strong> — читайте отзывы других пользователей, ставьте оценки полезным промптам
              </li>
              <li>
                <strong>Публикация своих промптов</strong> — делитесь своими наработками с сообществом
              </li>
              <li>
                <strong>Сохранение в избранное</strong> — сохраняйте понравившиеся промпты для быстрого доступа
              </li>
            </ol>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Популярные категории промптов</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Link href="/ru/prompts?category=writing" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Писательство и контент</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для создания текстов, статей, постов</p>
              </Link>
              <Link href="/ru/prompts?category=coding" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Программирование</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для написания кода, рефакторинга, отладки</p>
              </Link>
              <Link href="/ru/prompts?category=seo" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">SEO и маркетинг</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для оптимизации, анализа, контент-стратегии</p>
              </Link>
              <Link href="/ru/prompts?category=design" className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <h3 className="font-semibold mb-2">Дизайн</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Промпты для создания дизайн-концепций и описаний</p>
              </Link>
            </div>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Нужно ли платить за использование промптов?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Большинство промптов доступны бесплатно. Каждый промпт имеет указанную лицензию, 
                  которую необходимо соблюдать при использовании.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Могу ли я публиковать свои промпты?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Да, вы можете публиковать свои промпты на платформе. 
                  Это помогает сообществу и позволяет получать обратную связь.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Как выбрать подходящий промпт?</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Используйте фильтры по категории, модели AI, тегам. 
                  Обращайте внимание на рейтинг и количество отзывов.
                </p>
              </div>
            </div>
          </section>
          
          <div className="mt-8 p-6 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Начните работу с промптами</h2>
            <p className="mb-4">
              Перейдите в <Link href="/ru/prompts" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">каталог промптов</Link> чтобы найти готовые решения для ваших задач.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}

