import type { Metadata } from 'next';
import type { Locale } from '@/i18n/index';

export const BASE_URL = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';

/**
 * Генерация canonical URL
 */
export function buildCanonical(path: string, locale?: Locale): string {
  if (locale) {
    return `${BASE_URL}/${locale}${path}`;
  }
  return `${BASE_URL}${path}`;
}

/**
 * Генерация hreflang для страницы (возвращает объект для Metadata.alternates)
 */
export function buildHreflang(
  path: string,
  locales: Locale[] = ['ru', 'en'],
  xDefault: Locale = 'ru'
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  
  locales.forEach(locale => {
    languages[locale] = buildCanonical(path, locale);
  });
  
  languages['x-default'] = buildCanonical(path, xDefault);
  
  return {
    canonical: buildCanonical(path, xDefault),
    languages,
  };
}

/**
 * Обрезка title до SEO-оптимальной длины
 */
export function truncateTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title;
  return `${title.substring(0, maxLength - 3)}...`;
}

/**
 * Обрезка description до SEO-оптимальной длины
 */
export function truncateDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description;
  return `${description.substring(0, maxLength - 3)}...`;
}

/**
 * Генерация базовых ключевых слов
 */
export function getBaseKeywords(locale: Locale): string[] {
  if (locale === 'ru') {
    return [
      'маркетплейс промптов',
      'база промптов',
      'каталог промптов',
      'библиотека промптов',
      'промпты для ИИ',
      'ChatGPT промпты',
      'Claude промпты',
      'Gemini промпты',
      'AI промпты',
    ];
  }
  return [
    'prompt marketplace',
    'prompt library',
    'prompt catalog',
    'prompt database',
    'AI prompts',
    'ChatGPT prompts',
    'Claude prompts',
    'Gemini prompts',
  ];
}

/**
 * Генерация Open Graph metadata
 */
export function buildOpenGraph(
  title: string,
  description: string,
  url: string,
  locale: Locale,
  type: 'website' | 'article' = 'website',
  image?: string
): Metadata['openGraph'] {
  return {
    title: truncateTitle(title, 95),
    description: truncateDescription(description, 200),
    url,
    siteName: 'PromptHub',
    locale: locale === 'ru' ? 'ru_RU' : 'en_US',
    type,
    images: image
      ? [
          {
            url: image.startsWith('http') ? image : `${BASE_URL}${image}`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ]
      : [
          {
            url: `${BASE_URL}/og/prompt-hub-${locale}.png`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
  };
}

/**
 * Генерация Twitter Card metadata
 */
export function buildTwitterCard(
  title: string,
  description: string,
  image?: string
): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    title: truncateTitle(title, 70),
    description: truncateDescription(description, 200),
    images: image
      ? [image.startsWith('http') ? image : `${BASE_URL}${image}`]
      : [`${BASE_URL}/og/prompt-hub.png`],
  };
}

