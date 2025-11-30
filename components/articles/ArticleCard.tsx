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
    ? format(article.publishedAt, 'dd MMM yyyy', { locale: dateLocale })
    : null;

  const readingTime = estimateReadingTime(
    locale === 'ru' ? article.contentRu : article.contentEn
  );

  return (
    <article className="group bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all">
      <a href={`/${locale}/articles/${article.slug}`} className="block">
        {/* Обложка */}
        {article.coverImage ? (
          <div className="h-40 sm:h-48 overflow-hidden">
            <img
              src={article.coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <div className="text-white text-4xl sm:text-5xl">📝</div>
          </div>
        )}

        {/* Контент */}
        <div className="p-4 sm:p-5">
          {/* Теги */}
          {article.articleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {article.articleTags.slice(0, 3).map(at => (
                <span
                  key={at.tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  style={
                    at.tag.color
                      ? {
                          backgroundColor: `${at.tag.color}15`,
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
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h2>

          {/* Описание */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {description}
          </p>

          {/* Мета-информация */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            {formattedDate && (
              <time dateTime={article.publishedAt?.toISOString()} className="flex items-center gap-1">
                <span className="text-blue-600">📅</span>
                {formattedDate}
              </time>
            )}
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <span className="text-green-600">⏱️</span>
              {readingTime} {locale === 'ru' ? 'мин' : 'min'}
            </span>
            {article.viewCount > 0 && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-purple-600">👁️</span>
                  {article.viewCount}
                </span>
              </>
            )}
          </div>

          {/* Автор */}
          {article.author.name && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              {article.author.image && (
                <img
                  src={article.author.image}
                  alt={article.author.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full"
                />
              )}
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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

