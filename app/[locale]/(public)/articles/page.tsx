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

export async function generateMetadata({ params }: ArticlesPageProps): Promise<Metadata> {
  const { locale } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  return generateArticlesListMetadata(locale, baseUrl);
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
    <div className="space-y-8">
      {/* Заголовок раздела */}
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </header>

      {/* SEO-контент */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            {locale === 'ru' ? 'О разделе статей' : 'About Articles Section'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {locale === 'ru'
              ? 'В этом разделе вы найдете практические статьи, гайды и кейсы по работе с AI-инструментами. Мы делимся опытом создания эффективных промптов, рассказываем о лучших практиках и показываем реальные примеры применения нейросетей для решения бизнес-задач.'
              : 'In this section you will find practical articles, guides and case studies on working with AI tools. We share experience in creating effective prompts, talk about best practices and show real examples of using neural networks to solve business problems.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {locale === 'ru' ? 'Гайды и обучение' : 'Guides & Tutorials'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {locale === 'ru'
                  ? 'Пошаговые инструкции по работе с различными AI-моделями'
                  : 'Step-by-step instructions for working with various AI models'}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-2xl mb-2">💡</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {locale === 'ru' ? 'Лучшие практики' : 'Best Practices'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {locale === 'ru'
                  ? 'Проверенные методы и техники для достижения лучших результатов'
                  : 'Proven methods and techniques to achieve the best results'}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {locale === 'ru' ? 'Реальные кейсы' : 'Real Cases'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {locale === 'ru'
                  ? 'Примеры применения промптов в реальных проектах и задачах'
                  : 'Examples of using prompts in real projects and tasks'}
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {locale === 'ru'
              ? 'Хотите делиться своим опытом?'
              : 'Want to share your experience?'}
          </h2>
          <p className="text-lg mb-6 text-blue-100">
            {locale === 'ru'
              ? 'Присоединяйтесь к нашему сообществу и создавайте полезный контент вместе с нами.'
              : 'Join our community and create useful content with us.'}
          </p>
          <a
            href={`/${locale}/add`}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            {locale === 'ru' ? 'Добавить промпт' : 'Add Prompt'}
          </a>
        </div>
      </div>
    </div>
  );
}

