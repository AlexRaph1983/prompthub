import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import type { Locale } from '@/i18n/index';
import { articleRepository } from '@/lib/repositories/articleRepository';
import { promptRepository } from '@/lib/repositories/promptRepository';
import { generateArticleMetadata, generateArticleStructuredData, generateArticleBreadcrumbStructuredData } from '@/lib/seo-articles';
import { ArticleLayout } from '@/components/articles/ArticleLayout';

interface ArticlePageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = params;
  
  const article = await articleRepository.getArticleBySlug(slug);
  
  if (!article) {
    return {
      title: 'Статья не найдена',
      description: 'Запрашиваемая статья не существует'
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  return generateArticleMetadata(article, locale, baseUrl);
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = params;

  unstable_setRequestLocale(locale);

  // Получаем статью
  const article = await articleRepository.getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Проверяем статус статьи
  if (article.status !== 'published') {
    notFound();
  }

  // Увеличиваем счетчик просмотров (можно сделать асинхронно через API)
  // await articleRepository.incrementViewCount(article.id);

  // Получаем связанные статьи по тегам
  const tagIds = article.articleTags.map(at => at.tag.id);
  const relatedArticles = await articleRepository.getRelatedArticles(
    article.id,
    tagIds,
    3
  );

  // Получаем связанные промпты по тегам
  const tagSlugs = article.articleTags.map(at => at.tag.slug);
  let relatedPrompts: any[] = [];
  
  if (tagSlugs.length > 0) {
    // Получаем промпты для каждого тега и объединяем результаты
    const promptResults = await Promise.all(
      tagSlugs.slice(0, 3).map(tagSlug =>
        promptRepository.listPrompts({
          limit: 2,
          tag: tagSlug
        })
      )
    );

    // Объединяем и дедублицируем промпты
    const allPrompts = promptResults.flatMap(result => result.items);
    const uniquePromptsMap = new Map();
    allPrompts.forEach(prompt => {
      if (!uniquePromptsMap.has(prompt.id)) {
        uniquePromptsMap.set(prompt.id, prompt);
      }
    });
    relatedPrompts = Array.from(uniquePromptsMap.values()).slice(0, 6);
  }

  // Структурированные данные для SEO
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const articleStructuredData = generateArticleStructuredData(article, locale, baseUrl);
  const breadcrumbStructuredData = generateArticleBreadcrumbStructuredData(article, locale, baseUrl);

  return (
    <>
      {/* Структурированные данные */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />

      {/* Рендер статьи */}
      <ArticleLayout
        article={article}
        locale={locale}
        relatedArticles={relatedArticles}
        relatedPrompts={relatedPrompts}
      />
    </>
  );
}

