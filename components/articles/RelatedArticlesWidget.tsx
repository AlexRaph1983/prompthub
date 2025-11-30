'use client';

import React, { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/index';

interface ArticlePreview {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  publishedAt: string | null;
}

interface RelatedArticlesWidgetProps {
  tags: string[];
  locale: Locale;
  limit?: number;
}

/**
 * Виджет для отображения связанных статей (клиентский компонент)
 */
export function RelatedArticlesWidget({ tags, locale, limit = 3 }: RelatedArticlesWidgetProps) {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        
        // Создаем query string с тегами
        const tagsParam = tags.join(',');
        const response = await fetch(
          `/api/articles/by-tags?tags=${encodeURIComponent(tagsParam)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error('Error fetching related articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    }

    if (tags.length > 0) {
      fetchArticles();
    } else {
      setLoading(false);
    }
  }, [tags, limit]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || articles.length === 0) {
    return null;
  }

  const title = locale === 'ru' ? '📚 Полезные статьи по теме' : '📚 Related Articles';

  return (
    <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="space-y-4">
        {articles.map(article => {
          const articleTitle = locale === 'ru' ? article.titleRu : article.titleEn;
          const articleDescription = locale === 'ru' ? article.descriptionRu : article.descriptionEn;

          return (
            <a
              key={article.id}
              href={`/${locale}/articles/${article.slug}`}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {articleTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {articleDescription}
              </p>
            </a>
          );
        })}
      </div>
      <div className="mt-4">
        <a
          href={`/${locale}/articles`}
          className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          {locale === 'ru' ? 'Все статьи' : 'All articles'}
          <svg
            className="ml-1 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}

