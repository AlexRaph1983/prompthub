import React from 'react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { Locale } from '@/i18n/index';
import type { ArticleWithRelations } from '@/lib/repositories/articleRepository';

interface RelatedArticlesProps {
  articles: ArticleWithRelations[];
  locale: Locale;
}

/**
 * Компонент для отображения связанных статей
 */
export function RelatedArticles({ articles, locale }: RelatedArticlesProps) {
  const title = locale === 'ru' ? 'Связанные статьи' : 'Related Articles';
  const dateLocale = locale === 'ru' ? ru : enUS;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map(article => {
          const articleTitle = locale === 'ru' ? article.titleRu : article.titleEn;
          const articleDescription = locale === 'ru' ? article.descriptionRu : article.descriptionEn;
          const formattedDate = article.publishedAt
            ? format(article.publishedAt, 'dd MMM yyyy', { locale: dateLocale })
            : null;

          return (
            <a
              key={article.id}
              href={`/${locale}/articles/${article.slug}`}
              className="block group"
            >
              {article.coverImage && (
                <div className="mb-3 overflow-hidden rounded-lg">
                  <img
                    src={article.coverImage}
                    alt={articleTitle}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {articleTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {articleDescription}
              </p>
              {formattedDate && (
                <time className="text-xs text-gray-500 dark:text-gray-500">
                  {formattedDate}
                </time>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}

