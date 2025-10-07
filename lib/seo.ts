import type { Metadata } from 'next';
import type { Locale } from '@/i18n/index';
import type { CategoryWithChildren } from './categories';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

/**
 * Генерировать метаданные для страницы категории
 */
export function generateCategoryMetadata(
  category: CategoryWithChildren,
  locale: Locale,
  baseUrl: string
): Metadata {
  const { name, description } = getCategoryDisplayInfo(category, locale);
  const siteName = locale === 'ru' ? 'PromptHub' : 'PromptHub';
  const title = `${name} — ${siteName}`;
  const canonical = `${baseUrl}/${locale}/category/${category.slug}`;
  
  return {
    title,
    description: description || generateDefaultDescription(name, locale),
    keywords: generateKeywords(name, locale),
    alternates: {
      canonical,
      languages: {
        ru: `${baseUrl}/ru/category/${category.slug}`,
        en: `${baseUrl}/en/category/${category.slug}`
      }
    },
    openGraph: {
      title,
      description: description || generateDefaultDescription(name, locale),
      url: canonical,
      siteName,
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
      images: [
        {
          url: `/og/category-${category.slug}.png`,
          width: 1200,
          height: 630,
          alt: name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || generateDefaultDescription(name, locale),
      images: [`/og/category-${category.slug}.png`]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

/**
 * Генерировать метаданные для главной страницы
 */
export function generateHomeMetadata(locale: Locale, baseUrl: string): Metadata {
  const title = locale === 'ru' 
    ? 'PromptHub — библиотека и маркетплейс промптов для ИИ'
    : 'PromptHub — AI Prompt Library & Marketplace';
  
  const description = locale === 'ru'
    ? 'Находите и публикуйте лучшие промпты для ChatGPT, Claude, Gemini и других. Подборки, рейтинги, мультиязычность. Открыто и бесплатно.'
    : 'Discover, publish and optimize AI prompts for ChatGPT, Claude, Gemini and more. Curated collections, ratings, multilingual, open & free.';

  return {
    title,
    description,
    keywords: generateHomeKeywords(locale),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        ru: `${baseUrl}/ru`,
        en: `${baseUrl}/en`
      }
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: 'PromptHub',
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
      images: [
        {
          url: `/og/prompt-hub-${locale}.png`,
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
      images: [`/og/prompt-hub-${locale}.png`]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

/**
 * Получить отображаемую информацию о категории
 */
function getCategoryDisplayInfo(category: CategoryWithChildren, locale: Locale) {
  return {
    name: locale === 'ru' ? category.nameRu : category.nameEn,
    description: locale === 'ru' ? category.descriptionRu : category.descriptionEn
  };
}

/**
 * Генерировать описание по умолчанию
 */
function generateDefaultDescription(name: string, locale: Locale): string {
  if (locale === 'ru') {
    return `Коллекция промптов в категории "${name}". Находите готовые шаблоны для ИИ-моделей, делитесь своими промптами и ускоряйте работу с искусственным интеллектом.`;
  }
  
  return `Collection of prompts in "${name}" category. Find ready-to-use templates for AI models, share your prompts and accelerate your work with artificial intelligence.`;
}

/**
 * Генерировать ключевые слова для категории
 */
function generateKeywords(name: string, locale: Locale): string {
  const baseKeywords = locale === 'ru' 
    ? ['промпты', 'AI промпты', 'ChatGPT', 'Claude', 'Gemini']
    : ['prompts', 'AI prompts', 'ChatGPT', 'Claude', 'Gemini'];
  
  const categoryKeywords = name.toLowerCase().split(' ').filter(word => word.length > 2);
  
  return [...baseKeywords, ...categoryKeywords].join(', ');
}

/**
 * Генерировать ключевые слова для главной страницы
 */
function generateHomeKeywords(locale: Locale): string {
  return locale === 'ru'
    ? 'промпты, AI промпты, ChatGPT промпты, Claude промпты, Gemini промпты, SEO промпты, дизайн промпты, промпты для кулинарии, рецепты'
    : 'AI prompts, prompt marketplace, ChatGPT prompts, Claude prompts, Gemini prompts, SEO prompts, design prompts, coding prompts, cooking prompts';
}

/**
 * Генерировать структурированные данные для категории
 */
export function generateCategoryStructuredData(
  category: CategoryWithChildren,
  locale: Locale,
  baseUrl: string
) {
  const { name, description } = getCategoryDisplayInfo(category, locale);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: description || generateDefaultDescription(name, locale),
    url: `${baseUrl}/${locale}/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `${name} - Промпты`,
      description: `Коллекция промптов в категории ${name}`,
      numberOfItems: category.promptCount
    },
    breadcrumb: {
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
          name,
          item: `${baseUrl}/${locale}/category/${category.slug}`
        }
      ]
    }
  };
}
