'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getNavigationCategories } from '@/lib/categories';
import { createCategoryUrl } from '@/lib/url';
import type { Locale } from '@/i18n/index';
import type { CategoryWithChildren } from '@/lib/categories';

interface CategoryNavProps {
  locale: Locale;
  categories: CategoryWithChildren[];
  currentCategory?: string;
}

export default function CategoryNav({ locale, categories, currentCategory }: CategoryNavProps) {
  const t = useTranslations('categoryNav');
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const isActiveCategory = (categorySlug: string) => {
    return currentCategory === categorySlug || pathname.includes(`/category/${categorySlug}`);
  };

  const isExpanded = (categoryId: string) => {
    return expandedCategories.has(categoryId) || categories.some(cat => 
      cat.children?.some(child => isActiveCategory(child.slug))
    );
  };

  return (
    <nav className="w-full" role="navigation" aria-label={t('title')}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
        </div>
        
        <div className="p-2">
          <ul className="space-y-1" role="list">
            {/* Все категории */}
            <li>
              <Link
                href={`/${locale}/prompts`}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${pathname === `/${locale}/prompts` || pathname === `/${locale}`
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
                aria-current={pathname === `/${locale}/prompts` ? 'page' : undefined}
              >
                <span>{t('allCategories')}</span>
              </Link>
            </li>

            {/* Категории */}
            {categories.map((category) => {
              const hasChildren = category.children && category.children.length > 0;
              const isActive = isActiveCategory(category.slug);
              const isExpandedCategory = isExpanded(category.id);

              return (
                <li key={category.id}>
                  <div className="flex items-center">
                    {hasChildren && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        aria-expanded={isExpandedCategory}
                        aria-label={`${isExpandedCategory ? 'Скрыть' : 'Показать'} подкатегории ${category.nameRu}`}
                      >
                        {isExpandedCategory ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                    
                    <Link
                      href={createCategoryUrl(category.slug, locale)}
                      className={`
                        flex-1 flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{locale === 'ru' ? category.nameRu : category.nameEn}</span>
                      {category.promptCount > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {category.promptCount}
                        </span>
                      )}
                    </Link>
                  </div>

                  {/* Подкатегории */}
                  {hasChildren && isExpandedCategory && (
                    <ul className="ml-6 mt-1 space-y-1" role="list">
                      {category.children!.map((child) => {
                        const isChildActive = isActiveCategory(child.slug);
                        
                        return (
                          <li key={child.id}>
                            <Link
                              href={createCategoryUrl(child.slug, locale)}
                              className={`
                                flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                                ${isChildActive
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                }
                              `}
                              aria-current={isChildActive ? 'page' : undefined}
                            >
                              <span>{locale === 'ru' ? child.nameRu : child.nameEn}</span>
                              {child.promptCount > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {child.promptCount}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
