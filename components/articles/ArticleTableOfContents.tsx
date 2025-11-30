'use client';

import React from 'react';
import type { Locale } from '@/i18n/index';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface ArticleTableOfContentsProps {
  headings: Heading[];
  locale: Locale;
}

/**
 * Компонент оглавления статьи (Table of Contents)
 */
export function ArticleTableOfContents({ headings, locale }: ArticleTableOfContentsProps) {
  const title = locale === 'ru' ? 'Содержание' : 'Table of Contents';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Обновляем URL без перезагрузки страницы
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
        {title}
      </h3>
      <ul className="space-y-2">
        {headings.map((heading, index) => (
          <li
            key={index}
            className={heading.level === 3 ? 'ml-4' : ''}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

