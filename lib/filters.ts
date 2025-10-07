import type { Locale } from '@/i18n/index';

export interface FilterState {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  nsfw?: boolean;
  page?: number;
}

export interface FilterOptions {
  categories: Array<{ id: string; name: string; slug: string; count: number }>;
  tags: Array<{ id: string; name: string; slug: string; count: number; isNsfw: boolean }>;
  authors: Array<{ id: string; name: string; count: number }>;
}

/**
 * Парсить фильтры из URL параметров
 */
export function parseFiltersFromUrl(searchParams: URLSearchParams): FilterState {
  return {
    category: searchParams.get('category') || undefined,
    tag: searchParams.get('tag') || undefined,
    author: searchParams.get('author') || undefined,
    search: searchParams.get('search') || undefined,
    nsfw: searchParams.get('nsfw') === 'true',
    page: parseInt(searchParams.get('page') || '1', 10)
  };
}

/**
 * Создать URL параметры из фильтров
 */
export function createUrlParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.category) params.set('category', filters.category);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.author) params.set('author', filters.author);
  if (filters.search) params.set('search', filters.search);
  if (filters.nsfw) params.set('nsfw', 'true');
  if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
  
  return params;
}

/**
 * Создать URL строку из фильтров
 */
export function createFilterUrl(filters: FilterState, basePath: string): string {
  const params = createUrlParams(filters);
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Обновить фильтр
 */
export function updateFilter(
  currentFilters: FilterState,
  key: keyof FilterState,
  value: string | boolean | number | undefined
): FilterState {
  const newFilters = { ...currentFilters };
  
  if (value === undefined || value === '' || value === false) {
    delete newFilters[key];
  } else {
    newFilters[key] = value;
  }
  
  // Сбрасываем страницу при изменении фильтров
  if (key !== 'page') {
    delete newFilters.page;
  }
  
  return newFilters;
}

/**
 * Сбросить все фильтры
 */
export function resetFilters(): FilterState {
  return {};
}

/**
 * Проверить, есть ли активные фильтры
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return !!(filters.category || filters.tag || filters.author || filters.search || filters.nsfw);
}

/**
 * Получить описание активных фильтров
 */
export function getActiveFiltersDescription(
  filters: FilterState,
  options: FilterOptions,
  locale: Locale
): string {
  const parts: string[] = [];
  
  if (filters.category) {
    const category = options.categories.find(c => c.slug === filters.category);
    if (category) {
      parts.push(locale === 'ru' ? `Категория: ${category.name}` : `Category: ${category.name}`);
    }
  }
  
  if (filters.tag) {
    const tag = options.tags.find(t => t.slug === filters.tag);
    if (tag) {
      parts.push(locale === 'ru' ? `Тег: ${tag.name}` : `Tag: ${tag.name}`);
    }
  }
  
  if (filters.author) {
    const author = options.authors.find(a => a.id === filters.author);
    if (author) {
      parts.push(locale === 'ru' ? `Автор: ${author.name}` : `Author: ${author.name}`);
    }
  }
  
  if (filters.search) {
    parts.push(locale === 'ru' ? `Поиск: "${filters.search}"` : `Search: "${filters.search}"`);
  }
  
  if (filters.nsfw) {
    parts.push(locale === 'ru' ? 'NSFW контент' : 'NSFW content');
  }
  
  return parts.join(', ');
}

/**
 * Валидировать фильтры
 */
export function validateFilters(filters: FilterState): FilterState {
  const validated = { ...filters };
  
  // Валидация страницы
  if (validated.page && (validated.page < 1 || !Number.isInteger(validated.page))) {
    delete validated.page;
  }
  
  // Валидация поискового запроса
  if (validated.search && validated.search.trim().length < 2) {
    delete validated.search;
  }
  
  return validated;
}

/**
 * Создать фильтр для Prisma запроса
 */
export function createPrismaFilter(filters: FilterState) {
  const where: any = {};
  
  if (filters.category) {
    where.categoryId = filters.category;
  }
  
  if (filters.author) {
    where.authorId = filters.author;
  }
  
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  
  if (filters.tag) {
    where.promptTags = {
      some: {
        tag: {
          slug: filters.tag
        }
      }
    };
  }
  
  if (filters.nsfw === false) {
    where.promptTags = {
      none: {
        tag: {
          isNsfw: true
        }
      }
    };
  }
  
  return where;
}
