'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { getArticleCover } from '@/lib/articleCover';

type ArticlePreview = {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  coverImage?: string | null;
};

interface RandomArticlesCarouselProps {
  locale?: string;
  className?: string;
}

const baseBlockClasses =
  'w-full rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 ' +
  'dark:from-slate-900/60 dark:via-slate-900/80 dark:to-slate-900/60 ' +
  'border border-blue-100/70 dark:border-slate-700/70 shadow-sm p-4 sm:p-6';

export function RandomArticlesCarousel({
  locale: explicitLocale,
  className = '',
}: RandomArticlesCarouselProps) {
  const intlLocale = (() => {
    try {
      return useLocale();
    } catch {
      return undefined;
    }
  })();

  const locale = explicitLocale || intlLocale || 'ru';

  const [articles, setArticles] = React.useState<ArticlePreview[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;

    const loadArticles = async () => {
      try {
        const response = await fetch('/api/articles/random?limit=6');
        if (!response.ok) return;

        const data = await response.json();
        if (!ignore && data?.articles) {
          setArticles(data.articles);
        }
      } catch (error) {
        console.error('Failed to load random articles:', error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadArticles();

    return () => {
      ignore = true;
    };
  }, []);

  if (!loading && articles.length === 0) {
    return null;
  }

  const title =
    locale === 'ru'
      ? 'Полезные статьи по работе с AI'
      : 'Helpful articles about working with AI';

  const subtitle =
    locale === 'ru'
      ? 'Короткие практические руководства: Excel, маркетинг, аналитика и многое другое.'
      : 'Short practical guides: Excel, marketing, analytics and more.';

  return (
    <section className={className}>
      <div className={baseBlockClasses}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">📚</span>
              <span>{title}</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              {subtitle}
            </p>
          </div>
        </div>

        {loading && articles.length === 0 ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-[240px] max-w-[280px] rounded-xl bg-white/70 dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-700/80 animate-pulse"
              >
                <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex gap-3 sm:gap-4 px-1 snap-x snap-mandatory">
              {articles.map((article) => {
                const href = `/${locale}/articles/${article.slug}`;
                const cover = getArticleCover(article.slug, article.coverImage || undefined);
                const articleTitle =
                  locale === 'ru' ? article.titleRu : article.titleEn;
                const description =
                  locale === 'ru'
                    ? article.descriptionRu
                    : article.descriptionEn;

                return (
                  <Link
                    key={article.id}
                    href={href}
                    className="group min-w-[240px] max-w-[280px] sm:min-w-[260px] sm:max-w-[300px] snap-start rounded-xl bg-white dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-500 flex-shrink-0"
                  >
                    {cover && (
                      <div className="relative h-32 sm:h-36 w-full overflow-hidden">
                        <Image
                          src={cover}
                          alt={articleTitle}
                          fill
                          sizes="(max-width: 640px) 80vw, 300px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-3 sm:p-4">
                      <div className="text-[11px] uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
                        {locale === 'ru' ? 'Гайд по AI' : 'AI guide'}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {articleTitle}
                      </h3>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {description}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <span>{locale === 'ru' ? 'Читать' : 'Read'}</span>
                        <svg
                          className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
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
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


