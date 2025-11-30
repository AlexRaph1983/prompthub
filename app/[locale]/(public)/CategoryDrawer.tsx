'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import * as Sheet from '@radix-ui/react-dialog';
import { Menu, X, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { getNavigationCategories } from '@/lib/categories';
import { createCategoryUrl } from '@/lib/url';
import type { Locale } from '@/i18n/index';
import type { CategoryWithChildren } from '@/lib/categories';

interface CategoryDrawerProps {
  locale: Locale;
  categories: CategoryWithChildren[];
  currentCategory?: string;
}

export default function CategoryDrawer({ locale, categories, currentCategory }: CategoryDrawerProps) {
  const t = useTranslations('categoryNav');
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors lg:hidden"
        aria-label={t('title')}
      >
        <Menu className="w-5 h-5" />
        <span>{t('title')}</span>
      </button>

      {/* Drawer */}
      <Sheet.Root open={isOpen} onOpenChange={setIsOpen}>
        <Sheet.Portal>
          <Sheet.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Sheet.Content className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('title')}
              </h2>
              <Sheet.Close asChild>
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Закрыть меню"
                >
                  <X className="w-5 h-5" />
                </button>
              </Sheet.Close>
            </div>

            {/* Навигация */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav role="navigation" aria-label={t('title')}>
                <ul className="space-y-1" role="list">
                  {/* Все категории */}
                  <li>
                    <Link
                      href={`/${locale}/prompts`}
                      onClick={handleLinkClick}
                      className={`
                        flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors
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

                  {/* Статьи */}
                  <li>
                    <Link
                      href={`/${locale}/articles`}
                      onClick={handleLinkClick}
                      className={`
                        flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                        ${pathname === `/${locale}/articles` || pathname.includes(`/${locale}/articles/`)
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                        }
                      `}
                      aria-current={pathname === `/${locale}/articles` || pathname.includes(`/${locale}/articles/`) ? 'page' : undefined}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{locale === 'ru' ? 'Статьи' : 'Articles'}</span>
                    </Link>
                  </li>

                  {/* Разделитель */}
                  <li className="my-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
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
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mr-1"
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
                            onClick={handleLinkClick}
                            className={`
                              flex-1 flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors
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
                          <ul className="ml-8 mt-1 space-y-1" role="list">
                            {category.children!.map((child) => {
                              const isChildActive = isActiveCategory(child.slug);
                              
                              return (
                                <li key={child.id}>
                                  <Link
                                    href={createCategoryUrl(child.slug, locale)}
                                    onClick={handleLinkClick}
                                    className={`
                                      flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors
                                      ${isChildActive
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                      }
                                    `}
                                    aria-current={isChildActive ? 'page' : undefined}
                                  >
                                    <span>{locale === 'ru' ? (child.nameRu || child.name) : (child.nameEn || child.name)}</span>
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
              </nav>
            </div>
          </Sheet.Content>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
}
