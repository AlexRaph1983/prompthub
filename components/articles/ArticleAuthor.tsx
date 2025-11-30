import React from 'react';
import type { Locale } from '@/i18n/index';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface ArticleAuthorProps {
  author: Author;
  locale: Locale;
}

/**
 * Компонент для отображения автора статьи
 */
export function ArticleAuthor({ author, locale }: ArticleAuthorProps) {
  const displayName = author.name || (locale === 'ru' ? 'Команда PromptHub' : 'PromptHub Team');

  return (
    <div className="flex items-center gap-3">
      {author.image && (
        <img
          src={author.image}
          alt={displayName}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {displayName}
        </div>
      </div>
    </div>
  );
}

