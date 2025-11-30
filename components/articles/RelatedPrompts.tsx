import React from 'react';
import type { Locale } from '@/i18n/index';

interface RelatedPromptsProps {
  prompts: any[]; // Будет типизировано позже
  locale: Locale;
}

/**
 * Компонент для отображения связанных промптов
 */
export function RelatedPrompts({ prompts, locale }: RelatedPromptsProps) {
  const title = locale === 'ru' ? 'Готовые промпты по теме' : 'Related Prompts';
  const viewAllText = locale === 'ru' ? 'Смотреть все промпты' : 'View all prompts';

  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {prompts.slice(0, 6).map(prompt => (
          <a
            key={prompt.id}
            href={`/${locale}/prompt/${prompt.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {prompt.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {prompt.description}
            </p>
            {prompt.averageRating > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {prompt.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </a>
        ))}
      </div>
      <a
        href={`/${locale}/prompts`}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {viewAllText}
        <svg
          className="ml-2 w-5 h-5"
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
    </section>
  );
}

