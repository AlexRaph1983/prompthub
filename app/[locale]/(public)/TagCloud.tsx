'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/index';

interface Tag {
  id: string;
  name: string;
  slug: string;
  promptCount: number;
  color?: string;
}

interface TagCloudProps {
  locale: Locale;
  tags: Tag[];
}

export default function TagCloud({ locale, tags }: TagCloudProps) {
  const t = useTranslations('tagCloud');

  // Сортируем теги по популярности и берем топ 20
  const topTags = tags
    .sort((a, b) => b.promptCount - a.promptCount)
    .slice(0, 20);

  // Вычисляем размеры тегов на основе популярности
  const maxCount = Math.max(...topTags.map(tag => tag.promptCount));
  const minCount = Math.min(...topTags.map(tag => tag.promptCount));

  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 'text-sm';
    
    const ratio = (count - minCount) / (maxCount - minCount);
    
    if (ratio >= 0.8) return 'text-lg font-bold';
    if (ratio >= 0.6) return 'text-base font-semibold';
    if (ratio >= 0.4) return 'text-sm font-medium';
    if (ratio >= 0.2) return 'text-xs font-medium';
    return 'text-xs';
  };

  const getTagColor = (tag: Tag, index: number) => {
    if (tag.color) return tag.color;
    
    const colors = [
      'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'bg-green-100 text-green-800 hover:bg-green-200',
      'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'bg-red-100 text-red-800 hover:bg-red-200',
      'bg-teal-100 text-teal-800 hover:bg-teal-200',
      'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
      <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          {t('title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('description')}
        </p>
      </div>
      
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {topTags.map((tag, index) => (
            <Link
              key={tag.id}
              href={`/${locale}/tag/${tag.slug}`}
              className={`
                inline-block px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md
                ${getTagColor(tag, index)}
                ${getTagSize(tag.promptCount)}
              `}
              title={`${tag.promptCount} промптов`}
            >
              {tag.name}
            </Link>
          ))}
        </div>
        
        {topTags.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t('noTags')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
