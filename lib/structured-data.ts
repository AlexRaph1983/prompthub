import type { Locale } from '@/i18n/index';

export const BASE_URL = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';

/**
 * Генерация WebSite schema с SearchAction
 */
export function generateWebSiteSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PromptHub',
    url: `${BASE_URL}/${locale}`,
    description: locale === 'ru'
      ? 'Маркетплейс и библиотека промптов для ИИ. Находите, публикуйте и используйте лучшие промпты.'
      : 'AI Prompt Marketplace & Library. Discover, publish and use the best prompts.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/${locale}/prompts?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'PromptHub',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`
      }
    }
  };
}

/**
 * Генерация BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  locale: Locale
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Генерация ItemList schema для листингов
 */
export function generateItemListSchema(
  name: string,
  description: string,
  url: string,
  items: Array<{ name: string; url: string }>,
  numberOfItems?: number
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    url,
    numberOfItems: numberOfItems ?? items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: item.name,
        url: item.url
      }
    }))
  };
}

/**
 * Генерация CreativeWork schema для промпта
 */
export function generatePromptStructuredData(
  prompt: {
    id: string;
    title: string;
    description: string;
    prompt: string;
    model: string;
    category: string;
    tags?: string;
    license: string;
    author?: { name: string | null };
    createdAt: Date;
    updatedAt: Date;
  },
  locale: Locale
) {
  const url = `${BASE_URL}/prompt/${prompt.id}`;
  const tags = prompt.tags ? prompt.tags.split(',').map(t => t.trim()) : [];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: prompt.title,
    description: prompt.description,
    url,
    datePublished: prompt.createdAt.toISOString(),
    dateModified: prompt.updatedAt.toISOString(),
    license: prompt.license,
    keywords: tags.join(', '),
    about: {
      '@type': 'Thing',
      name: prompt.category
    },
    ...(prompt.author?.name && {
      author: {
        '@type': 'Person',
        name: prompt.author.name
      }
    }),
    publisher: {
      '@type': 'Organization',
      name: 'PromptHub',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    // Дополнительные поля для лучшей индексации
    usageInfo: prompt.prompt.substring(0, 500), // Первые 500 символов промпта
    applicationCategory: 'AI Prompt',
    operatingSystem: prompt.model
  };
}

