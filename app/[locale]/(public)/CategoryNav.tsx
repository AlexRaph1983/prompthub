'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Home, Briefcase, Heart, GraduationCap, PenTool, Image, Video, MessageSquare, Code, Search, Palette, Music, Volume2, Box, Zap, TrendingUp, DollarSign, ChefHat } from 'lucide-react';
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

  const getCategoryIcon = (categorySlug: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'legal': Briefcase,
      'health': Heart,
      'education': GraduationCap,
      'marketing': PenTool,
      'image': Image,
      'video': Video,
      'chat': MessageSquare,
      'code': Code,
      'seo': Search,
      'design': Palette,
      'music': Music,
      'audio': Volume2,
      '3d': Box,
      'animation': Zap,
      'business': TrendingUp,
      'finance': DollarSign,
      'cooking': ChefHat,
    };
    
    return iconMap[categorySlug] || Home;
  };

  return (
    <nav className="w-full" role="navigation" aria-label={t('title')}>
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {t('title')}
          </h2>
        </div>
        
        <div className="p-3">
          <ul className="space-y-0.5" role="list">
            {/* Все категории */}
            <li>
              <Link
                href={`/${locale}/prompts`}
                className={`
                  group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${pathname === `/${locale}/prompts` || pathname === `/${locale}`
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 dark:hover:text-blue-300'
                  }
                `}
                aria-current={pathname === `/${locale}/prompts` ? 'page' : undefined}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`
                    p-1 rounded-md transition-all duration-200
                    ${pathname === `/${locale}/prompts` || pathname === `/${locale}`
                      ? 'bg-white/20'
                      : 'bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-800/40'
                    }
                  `}>
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium truncate">{t('allCategories')}</span>
                </div>
                {(pathname === `/${locale}/prompts` || pathname === `/${locale}`) && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            </li>

            {/* Категории */}
            {categories.map((category) => {
              const hasChildren = category.children && category.children.length > 0;
              const isActive = isActiveCategory(category.slug);
              const isExpandedCategory = isExpanded(category.id);
              const IconComponent = getCategoryIcon(category.slug);

              return (
                <li key={category.id}>
                  <div className="flex items-center">
                    {hasChildren && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className={`
                          p-1 rounded-md transition-all duration-200 hover:scale-105
                          ${isExpandedCategory 
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                          }
                        `}
                        aria-expanded={isExpandedCategory}
                        aria-label={`${isExpandedCategory ? 'Скрыть' : 'Показать'} подкатегории ${category.nameRu}`}
                      >
                        {isExpandedCategory ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    
                    <Link
                      href={createCategoryUrl(category.slug, locale)}
                      className={`
                        group flex-1 flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 dark:hover:text-blue-300'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`
                          p-1 rounded-md transition-all duration-200
                          ${isActive
                            ? 'bg-white/20'
                            : 'bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-800/40'
                          }
                        `}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate font-medium">{locale === 'ru' ? category.nameRu : category.nameEn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.promptCount > 0 && (
                          <span className={`
                            text-xs px-1.5 py-0.5 rounded-full font-medium transition-all duration-200
                            ${isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:group-hover:bg-blue-800/40'
                            }
                          `}>
                            {category.promptCount}
                          </span>
                        )}
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Подкатегории */}
                  {hasChildren && isExpandedCategory && (
                    <ul className="ml-4 mt-1 space-y-0.5" role="list">
                      {category.children!.map((child) => {
                        const isChildActive = isActiveCategory(child.slug);
                        const ChildIconComponent = getCategoryIcon(child.slug);
                        
                        return (
                          <li key={child.id}>
                            <Link
                              href={createCategoryUrl(child.slug, locale)}
                              className={`
                                group flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all duration-200
                                ${isChildActive
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-gradient-to-r dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 dark:hover:text-indigo-300'
                                }
                              `}
                              aria-current={isChildActive ? 'page' : undefined}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`
                                  p-1 rounded transition-all duration-200
                                  ${isChildActive
                                    ? 'bg-white/20'
                                    : 'bg-indigo-100 group-hover:bg-indigo-200 dark:bg-indigo-900/30 dark:group-hover:bg-indigo-800/40'
                                  }
                                `}>
                                  <ChildIconComponent className="w-3 h-3" />
                                </div>
                                <span className="truncate font-medium">{locale === 'ru' ? child.nameRu : child.nameEn}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {child.promptCount > 0 && (
                                  <span className={`
                                    text-xs px-1.5 py-0.5 rounded-full font-medium transition-all duration-200
                                    ${isChildActive
                                      ? 'bg-white/20 text-white'
                                      : 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:group-hover:bg-indigo-800/40'
                                    }
                                  `}>
                                    {child.promptCount}
                                  </span>
                                )}
                                {isChildActive && (
                                  <div className="w-1 h-1 bg-white rounded-full"></div>
                                )}
                              </div>
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
