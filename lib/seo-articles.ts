import type { Metadata } from 'next';
import type { Locale } from '@/i18n/index';
import type { ArticleWithRelations } from './repositories/articleRepository';

/**
 * Генерировать метаданные для страницы списка статей
 */
export function generateArticlesListMetadata(
  locale: Locale,
  baseUrl: string
): Metadata {
  const title = locale === 'ru'
    ? 'Статьи о промптах и работе с нейросетями | PromptHub'
    : 'Articles about prompts and AI | PromptHub';

  const description = locale === 'ru'
    ? 'Полезные статьи, гайды и советы по созданию промптов для ChatGPT, Claude, Gemini и других нейросетей. Примеры использования, лучшие практики и кейсы.'
    : 'Useful articles, guides and tips on creating prompts for ChatGPT, Claude, Gemini and other neural networks. Use cases, best practices and examples.';

  return {
    title,
    description,
    keywords: generateArticlesKeywords(locale),
    alternates: {
      canonical: `${baseUrl}/${locale}/articles`,
      languages: {
        ru: `${baseUrl}/ru/articles`,
        en: `${baseUrl}/en/articles`,
        'x-default': `${baseUrl}/ru/articles`
      }
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}/articles`,
      siteName: 'PromptHub',
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
      images: [
        {
          url: `/og/articles-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/articles-${locale}.png`]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

/**
 * Генерировать метаданные для страницы статьи
 */
export function generateArticleMetadata(
  article: ArticleWithRelations,
  locale: Locale,
  baseUrl: string
): Metadata {
  const title = locale === 'ru' ? article.titleRu : article.titleEn;
  const description = locale === 'ru' ? article.descriptionRu : article.descriptionEn;
  const canonical = `${baseUrl}/${locale}/articles/${article.slug}`;

  const tags = article.articleTags.map(at => at.tag.name);
  const keywords = [...tags, ...getBaseKeywords(locale)].join(', ');

  const publishedTime = article.publishedAt?.toISOString();
  const modifiedTime = article.updatedAt.toISOString();

  return {
    title: `${title} | PromptHub`,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ru: `${baseUrl}/ru/articles/${article.slug}`,
        en: `${baseUrl}/en/articles/${article.slug}`,
        'x-default': `${baseUrl}/ru/articles/${article.slug}`
      }
    },
    authors: article.author.name ? [{ name: article.author.name }] : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'PromptHub',
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: article.author.name ? [article.author.name] : undefined,
      tags,
      images: article.coverImage
        ? [
            {
              url: article.coverImage,
              width: 1200,
              height: 630,
              alt: title
            }
          ]
        : [
            {
              url: `/og/article-${article.slug}.png`,
              width: 1200,
              height: 630,
              alt: title
            }
          ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.coverImage
        ? [article.coverImage]
        : [`/og/article-${article.slug}.png`]
    },
    robots: {
      index: article.status === 'published',
      follow: article.status === 'published'
    }
  };
}

/**
 * Генерировать структурированные данные для статьи (JSON-LD)
 */
export function generateArticleStructuredData(
  article: ArticleWithRelations,
  locale: Locale,
  baseUrl: string
) {
  const title = locale === 'ru' ? article.titleRu : article.titleEn;
  const description = locale === 'ru' ? article.descriptionRu : article.descriptionEn;
  const url = `${baseUrl}/${locale}/articles/${article.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: article.coverImage || `${baseUrl}/og/article-${article.slug}.png`,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author.name || 'PromptHub Team',
      url: article.author.website || `${baseUrl}/${locale}/profile/${article.author.id}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptHub',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    keywords: article.articleTags.map(at => at.tag.name).join(', '),
    articleSection: locale === 'ru' ? 'Гайды и статьи' : 'Guides and Articles',
    wordCount: estimateWordCount(
      locale === 'ru' ? article.contentRu : article.contentEn
    )
  };
}

/**
 * Генерировать хлебные крошки для статьи
 */
export function generateArticleBreadcrumbStructuredData(
  article: ArticleWithRelations,
  locale: Locale,
  baseUrl: string
) {
  const title = locale === 'ru' ? article.titleRu : article.titleEn;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'ru' ? 'Главная' : 'Home',
        item: `${baseUrl}/${locale}`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'ru' ? 'Статьи' : 'Articles',
        item: `${baseUrl}/${locale}/articles`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${baseUrl}/${locale}/articles/${article.slug}`
      }
    ]
  };
}

/**
 * Вспомогательная функция для оценки количества слов
 */
function estimateWordCount(content: string): number {
  // Убираем markdown-синтаксис и считаем слова
  const plainText = content
    .replace(/#{1,6}\s/g, '') // заголовки
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // ссылки
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`([^`]+)`/g, '$1'); // inline code

  const words = plainText.trim().split(/\s+/);
  return words.length;
}

/**
 * Базовые ключевые слова для статей
 */
function getBaseKeywords(locale: Locale): string[] {
  return locale === 'ru'
    ? [
        'промпты',
        'AI',
        'искусственный интеллект',
        'ChatGPT',
        'Claude',
        'Gemini',
        'нейросети',
        'гайд'
      ]
    : [
        'prompts',
        'AI',
        'artificial intelligence',
        'ChatGPT',
        'Claude',
        'Gemini',
        'neural networks',
        'guide'
      ];
}

/**
 * Генерировать ключевые слова для списка статей
 */
function generateArticlesKeywords(locale: Locale): string {
  const keywords = locale === 'ru'
    ? [
        'статьи о промптах',
        'гайды по AI',
        'как писать промпты',
        'ChatGPT гайды',
        'работа с нейросетями',
        'примеры промптов',
        'лучшие практики AI',
        'обучение промптингу'
      ]
    : [
        'prompt articles',
        'AI guides',
        'how to write prompts',
        'ChatGPT guides',
        'working with neural networks',
        'prompt examples',
        'AI best practices',
        'prompt engineering'
      ];

  return keywords.join(', ');
}

