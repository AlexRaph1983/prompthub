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
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        <a
          href={`/${locale}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {locale === 'ru' ? 'Главная' : 'Home'}
        </a>
        <span className="mx-2">/</span>
        <a
          href={`/${locale}/articles`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {locale === 'ru' ? 'Статьи' : 'Articles'}
        </a>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">{title}</span>
      </nav>

      {/* Заголовок и мета-информация */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {title}
        </h1>

        {description && (
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {/* Автор и дата */}
        <div className="flex items-center gap-6 mb-4">
          <ArticleAuthor author={article.author} locale={locale} />

          {formattedDate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={article.publishedAt?.toISOString()}>
                {formattedDate}
              </time>
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {article.viewCount} {locale === 'ru' ? 'просмотров' : 'views'}
          </div>
        </div>

        {/* Теги */}
        {article.articleTags.length > 0 && (
          <ArticleTags tags={article.articleTags.map(at => at.tag)} locale={locale} />
        )}
      </header>

      {/* Обложка */}
      {coverImage && (
        <div className="mb-8 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900/60 border border-gray-200/70 dark:border-gray-700/70">
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

      {/* Контейнер с оглавлением и контентом */}
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
        <div className={headings.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <ArticleContent content={content} />
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
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'ru' ? 'Поделиться статьей' : 'Share article'}
        </h3>
        <div className="flex gap-4">
          <ShareButton
            platform="twitter"
            url={`${process.env.NEXT_PUBLIC_APP_HOST}/${locale}/articles/${article.slug}`}
            title={title}
          />
          <ShareButton
            platform="facebook"
            url={`${process.env.NEXT_PUBLIC_APP_HOST}/${locale}/articles/${article.slug}`}
            title={title}
          />
          <ShareButton
            platform="telegram"
            url={`${process.env.NEXT_PUBLIC_APP_HOST}/${locale}/articles/${article.slug}`}
            title={title}
          />
        </div>
      </div>
    </article>
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

/**
 * Компонент кнопки "Поделиться"
 */
function ShareButton({
  platform,
  url,
  title
}: {
  platform: 'twitter' | 'facebook' | 'telegram';
  url: string;
  title: string;
}) {
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  };

  const labels = {
    twitter: 'Twitter',
    facebook: 'Facebook',
    telegram: 'Telegram'
  };

  return (
    <a
      href={shareUrls[platform]}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {labels[platform]}
    </a>
  );
}

