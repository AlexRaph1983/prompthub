import React from 'react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { Locale } from '@/i18n/index';
import type { ArticleWithRelations } from '@/lib/repositories/articleRepository';

interface ArticleCardProps {
  article: ArticleWithRelations;
  locale: Locale;
}

/**
 * Карточка статьи для списка
 */
export function ArticleCard({ article, locale }: ArticleCardProps) {
  const title = locale === 'ru' ? article.titleRu : article.titleEn;
  const description = locale === 'ru' ? article.descriptionRu : article.descriptionEn;
  const dateLocale = locale === 'ru' ? ru : enUS;
  
  const formattedDate = article.publishedAt
    ? format(article.publishedAt, 'dd MMMM yyyy', { locale: dateLocale })
    : null;

  const readingTime = estimateReadingTime(
    locale === 'ru' ? article.contentRu : article.contentEn
  );

  return (
    <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      <a href={`/${locale}/articles/${article.slug}`} className="block">
        {/* Обложка */}
        {article.coverImage ? (
          <div className="h-48 overflow-hidden">
            <img
              src={article.coverImage}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <div className="text-white text-6xl">📝</div>
          </div>
        )}

        {/* Контент */}
        <div className="p-6">
          {/* Теги */}
          {article.articleTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {article.articleTags.slice(0, 3).map(at => (
                <span
                  key={at.tag.id}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  style={
                    at.tag.color
                      ? {
                          backgroundColor: `${at.tag.color}20`,
                          color: at.tag.color
                        }
                      : undefined
                  }
                >
                  {at.tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Заголовок */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {title}
          </h2>

          {/* Описание */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {description}
          </p>

          {/* Мета-информация */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            {formattedDate && (
              <time dateTime={article.publishedAt?.toISOString()}>
                {formattedDate}
              </time>
            )}
            <span>•</span>
            <span>
              {readingTime} {locale === 'ru' ? 'мин чтения' : 'min read'}
            </span>
            {article.viewCount > 0 && (
              <>
                <span>•</span>
                <span>
                  {article.viewCount} {locale === 'ru' ? 'просмотров' : 'views'}
                </span>
              </>
            )}
          </div>

          {/* Автор */}
          {article.author.name && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              {article.author.image && (
                <img
                  src={article.author.image}
                  alt={article.author.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {article.author.name}
              </span>
            </div>
          )}
        </div>
      </a>
    </article>
  );
}

/**
 * Оценка времени чтения статьи
 */
function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

