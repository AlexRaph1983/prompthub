import React from 'react';
import type { Locale } from '@/i18n/index';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface ArticleTagsProps {
  tags: Tag[];
  locale: Locale;
}

/**
 * Компонент для отображения тегов статьи
 */
export function ArticleTags({ tags, locale }: ArticleTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <a
          key={tag.id}
          href={`/${locale}/tag/${tag.slug}`}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          style={
            tag.color
              ? {
                  backgroundColor: `${tag.color}20`,
                  color: tag.color
                }
              : undefined
          }
        >
          {tag.name}
        </a>
      ))}
    </div>
  );
}

