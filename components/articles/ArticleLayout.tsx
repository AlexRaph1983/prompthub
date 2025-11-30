import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { Locale } from '@/i18n/index';
import type { ArticleWithRelations } from '@/lib/repositories/articleRepository';
import { getArticleCover } from '@/lib/articleCover';
import { ArticleContent } from './ArticleContent';
import { ArticleTags } from './ArticleTags';
import { ArticleAuthor } from './ArticleAuthor';
import { ArticleTableOfContents } from './ArticleTableOfContents';
import { RelatedArticles } from './RelatedArticles';
import { RelatedPrompts } from './RelatedPrompts';
import { ArticleCTA } from './ArticleCTA';
import { ArticleShareBlock } from './ArticleShareBlock';

interface ArticleLayoutProps {
  article: ArticleWithRelations;
  locale: Locale;
  relatedArticles?: ArticleWithRelations[];
  relatedPrompts?: any[]; // Будет типизировано из PromptRepository
}

export function ArticleLayout({
  article,
  locale,
  relatedArticles = [],
  relatedPrompts = []
}: ArticleLayoutProps) {
  const title = locale === 'ru' ? article.titleRu : article.titleEn;
  const content = locale === 'ru' ? article.contentRu : article.contentEn;
  const description = locale === 'ru' ? article.descriptionRu : article.descriptionEn;

  const dateLocale = locale === 'ru' ? ru : enUS;
  const formattedDate = article.publishedAt
    ? format(article.publishedAt, 'dd MMMM yyyy', { locale: dateLocale })
    : null;

  const coverImage = getArticleCover(article.slug, article.coverImage);

  // Извлечь заголовки для оглавления
  const headings = extractHeadings(content);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Хлебные крошки */}
        <nav className="mb-5 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-1">
          <a
            href={`/${locale}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {locale === 'ru' ? 'Главная' : 'Home'}
          </a>
          <span className="opacity-60">/</span>
          <a
            href={`/${locale}/articles`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {locale === 'ru' ? 'Статьи' : 'Articles'}
          </a>
          <span className="opacity-60">/</span>
          <span className="text-gray-900 dark:text-white line-clamp-1">
            {title}
          </span>
        </nav>

        {/* Заголовок и мета-информация */}
        <header className="mb-8 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/70 shadow-sm p-5 sm:p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
            {title}
          </h1>

          {description && (
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
              {description}
            </p>
          )}

          {/* Автор, дата, просмотры */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <ArticleAuthor author={article.author} locale={locale} />

            {formattedDate && (
              <div>
                <time dateTime={article.publishedAt?.toISOString()}>
                  {formattedDate}
                </time>
              </div>
            )}

            <div>
              {article.viewCount}{' '}
              {locale === 'ru' ? 'просмотров' : 'views'}
            </div>
          </div>

          {/* Теги */}
          {article.articleTags.length > 0 && (
            <div className="mt-4">
              <ArticleTags
                tags={article.articleTags.map((at) => at.tag)}
                locale={locale}
              />
            </div>
          )}

          {/* Обложка */}
          {coverImage && (
            <div className="mt-6 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900/60 border border-gray-200/70 dark:border-gray-700/70">
              <div className="relative w-full h-56 sm:h-64 md:h-72">
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 960px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </header>

        {/* Контент + оглавление */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Оглавление (десктоп) */}
          {headings.length > 0 && (
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-8">
                <ArticleTableOfContents headings={headings} locale={locale} />
              </div>
            </aside>
          )}

          {/* Основной контент */}
          <div
            className={
              headings.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'
            }
          >
            <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/70 shadow-sm p-5 sm:p-7">
              <ArticleContent content={content} />
            </div>
          </div>
        </div>

        {/* CTA блок */}
        <ArticleCTA locale={locale} />

        {/* Связанные промпты */}
        {relatedPrompts.length > 0 && (
          <div className="mb-12">
            <RelatedPrompts prompts={relatedPrompts} locale={locale} />
          </div>
        )}

        {/* Связанные статьи */}
        {relatedArticles.length > 0 && (
          <div className="mb-12">
            <RelatedArticles articles={relatedArticles} locale={locale} />
          </div>
        )}

        {/* Поделиться */}
        <div className="mt-10 border-t border-slate-200/80 dark:border-slate-700/80 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📤</span>
            <span>
              {locale === 'ru' ? 'Поделиться статьёй' : 'Share this article'}
            </span>
          </h3>
          <ArticleShareBlock />
        </div>
      </article>
    </div>
  );
}

/**
 * Извлечь заголовки из markdown контента
 */
function extractHeadings(markdown: string): { level: number; text: string; id: string }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { level: number; text: string; id: string }[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({ level, text, id });
  }

  return headings;
}

