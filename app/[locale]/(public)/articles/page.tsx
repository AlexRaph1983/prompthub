import { unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import type { Locale } from '@/i18n/index';
import { articleRepository } from '@/lib/repositories/articleRepository';
import { generateArticlesListMetadata } from '@/lib/seo-articles';
import { ArticleCard } from '@/components/articles/ArticleCard';

interface ArticlesPageProps {
  params: { locale: Locale };
  searchParams: { page?: string };
}

export async function generateMetadata({ params, searchParams }: ArticlesPageProps): Promise<Metadata> {
  const { locale } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const metadata = generateArticlesListMetadata(locale, baseUrl);
  const canonicalLocale: Locale = 'ru';
  const canonical = `${baseUrl}/${canonicalLocale}/articles`;
  const hasPageParam = Boolean(searchParams?.page && searchParams.page !== '1');

  metadata.alternates = { canonical };
  metadata.openGraph = {
    ...metadata.openGraph,
    url: canonical,
    locale: 'ru_RU'
  };
  metadata.robots = {
    index: locale === canonicalLocale && !hasPageParam,
    follow: true
  };

  return metadata;
}

export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const { locale } = params;
  const { page = '1' } = searchParams;

  unstable_setRequestLocale(locale);

  // Получаем статьи
  const { items: articles, hasMore, nextCursor } = await articleRepository.listArticles({
    limit: 12,
    locale,
    status: 'published'
  });

  const title = locale === 'ru' 
    ? 'Статьи о промптах и работе с нейросетями' 
    : 'Articles about prompts and AI';

  const subtitle = locale === 'ru'
    ? 'Полезные гайды, советы и практические примеры использования AI-инструментов'
    : 'Useful guides, tips and practical examples of using AI tools';

  return (
    <div className="space-y-6">
      {/* Заголовок раздела */}
      <header className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </header>

      {/* SEO-контент */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="max-w-none">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {locale === 'ru' ? 'О разделе статей' : 'About Articles Section'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {locale === 'ru'
              ? 'Практические статьи, гайды и кейсы по работе с AI-инструментами. Опыт создания эффективных промптов, лучшие практики и реальные примеры применения нейросетей.'
              : 'Practical articles, guides and case studies on working with AI tools. Experience in creating effective prompts, best practices and real examples of using neural networks.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📚</span>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {locale === 'ru' ? 'Гайды' : 'Guides'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {locale === 'ru'
                  ? 'Пошаговые инструкции по работе с AI-моделями'
                  : 'Step-by-step instructions for AI models'}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💡</span>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {locale === 'ru' ? 'Практики' : 'Best Practices'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {locale === 'ru'
                  ? 'Проверенные методы и техники'
                  : 'Proven methods and techniques'}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  {locale === 'ru' ? 'Кейсы' : 'Real Cases'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {locale === 'ru'
                  ? 'Примеры применения в реальных проектах'
                  : 'Examples in real projects'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Список статей */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {locale === 'ru'
              ? 'Статьи скоро появятся. Следите за обновлениями!'
              : 'Articles coming soon. Stay tuned!'}
          </p>
        </div>
      )}

      {/* Пагинация (если есть ещё статьи) */}
      {hasMore && (
        <div className="flex justify-center">
          <a
            href={`/${locale}/articles?page=${parseInt(page) + 1}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {locale === 'ru' ? 'Загрузить ещё' : 'Load More'}
          </a>
        </div>
      )}

      {/* CTA блок */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-5 sm:p-6 md:p-8 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
            {locale === 'ru'
              ? 'Хотите делиться своим опытом?'
              : 'Want to share your experience?'}
          </h2>
          <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 text-blue-100">
            {locale === 'ru'
              ? 'Присоединяйтесь к сообществу и создавайте полезный контент.'
              : 'Join our community and create useful content.'}
          </p>
          <a
            href={`/${locale}/add`}
            className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base"
          >
            {locale === 'ru' ? 'Добавить промпт' : 'Add Prompt'}
          </a>
        </div>
      </div>
    </div>
  );
}

