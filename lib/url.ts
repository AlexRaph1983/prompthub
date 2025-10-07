import type { Locale } from '@/i18n/index';

/**
 * Создать URL для категории
 */
export function createCategoryUrl(slug: string, locale: Locale): string {
  return `/${locale}/category/${slug}`;
}

/**
 * Создать URL для тега
 */
export function createTagUrl(slug: string, locale: Locale): string {
  return `/${locale}/tag/${slug}`;
}

/**
 * Создать URL для главной страницы
 */
export function createHomeUrl(locale: Locale): string {
  return `/${locale}`;
}

/**
 * Создать URL для страницы промптов с фильтрами
 */
export function createPromptsUrl(
  locale: Locale,
  filters: {
    category?: string;
    tag?: string;
    author?: string;
    search?: string;
    page?: number;
  } = {}
): string {
  const baseUrl = `/${locale}/prompts`;
  const params = new URLSearchParams();
  
  if (filters.category) params.set('category', filters.category);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.author) params.set('author', filters.author);
  if (filters.search) params.set('search', filters.search);
  if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Парсить фильтры из URL
 */
export function parseFiltersFromUrl(searchParams: URLSearchParams) {
  return {
    category: searchParams.get('category') || undefined,
    tag: searchParams.get('tag') || undefined,
    author: searchParams.get('author') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10)
  };
}

/**
 * Создать URL для страницы категории с подкатегорией
 */
export function createSubcategoryUrl(
  parentSlug: string,
  childSlug: string,
  locale: Locale
): string {
  return `/${locale}/category/${parentSlug}/${childSlug}`;
}

/**
 * Создать URL для страницы с NSFW фильтром
 */
export function createNsfwUrl(locale: Locale, baseUrl: string): string {
  const params = new URLSearchParams();
  params.set('nsfw', 'true');
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Проверить, является ли URL NSFW
 */
export function isNsfwUrl(searchParams: URLSearchParams): boolean {
  return searchParams.get('nsfw') === 'true';
}

/**
 * Создать canonical URL
 */
export function createCanonicalUrl(path: string, baseUrl: string): string {
  return `${baseUrl}${path}`;
}

/**
 * Создать hreflang URL
 */
export function createHreflangUrl(path: string, locale: Locale, baseUrl: string): string {
  return `${baseUrl}/${locale}${path}`;
}
