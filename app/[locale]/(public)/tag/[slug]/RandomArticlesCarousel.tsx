'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Article {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string | null;
  descriptionEn: string | null;
  coverImage: string | null;
}

interface RandomArticlesCarouselProps {
  locale: string;
}

export function RandomArticlesCarousel({ locale }: RandomArticlesCarouselProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/articles/random?limit=6');
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Error fetching random articles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, articles.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, articles.length - 3) : prev - 1
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700/30 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="h-40 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  const visibleArticles = articles.slice(currentIndex, currentIndex + 3);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700/30 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
              Полезные статьи
            </h3>
          </div>
          
          {articles.length > 3 && (
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Предыдущая"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex >= articles.length - 3}
                className="p-2 rounded-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Следующая"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleArticles.map((article) => {
            const title = locale === 'ru' ? article.titleRu : article.titleEn;
            const description = locale === 'ru' ? article.descriptionRu : article.descriptionEn;

            return (
              <a
                key={article.id}
                href={`/${locale}/articles/${article.slug}`}
                className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300"
              >
                {/* Обложка */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback если изображение не загрузилось
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700"
                    style={{ display: article.coverImage ? 'none' : 'flex' }}
                  >
                    <span className="text-5xl opacity-80">📄</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-colors"></div>
                </div>

                {/* Контент */}
                <div className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                  </h4>
                  {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    <span>Читать статью</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Индикаторы */}
        {articles.length > 3 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(articles.length / 3) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * 3)}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / 3) === idx
                    ? 'w-8 bg-blue-600 dark:bg-blue-400'
                    : 'w-2 bg-blue-300 dark:bg-blue-700 hover:bg-blue-400 dark:hover:bg-blue-600'
                }`}
                aria-label={`Слайд ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

