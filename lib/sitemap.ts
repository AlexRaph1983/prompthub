import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SITEMAP_CONFIG = {
  BASE_URL: 'https://prompt-hub.site',
  LOCALES: ['ru', 'en'] as const,
  PROMPTS_PER_PAGE: 10000, // Лимит URL на карту
  REVALIDATE_TIME: 3600, // 1 час
} as const;

export type Locale = typeof SITEMAP_CONFIG.LOCALES[number];

// XML namespaces
export const XML_NAMESPACES = {
  sitemap: 'http://www.sitemaps.org/schemas/sitemap/0.9',
  xhtml: 'http://www.w3.org/1999/xhtml',
} as const;

// Приоритеты и частоты обновления
export const SITEMAP_PRIORITIES = {
  root: { priority: '1.0', changefreq: 'daily' },
  categories: { priority: '0.7', changefreq: 'weekly' },
  tags: { priority: '0.6', changefreq: 'weekly' },
  prompts: { priority: '0.8', changefreq: 'monthly' },
} as const;

// Форматирование даты в ISO 8601
export function formatLastMod(date: Date): string {
  return date.toISOString();
}

// Билдер канонических URL
export function buildCanonicalUrl(path: string, locale?: Locale): string {
  const baseUrl = SITEMAP_CONFIG.BASE_URL;
  
  if (locale) {
    return `${baseUrl}/${locale}${path}`;
  }
  
  return `${baseUrl}${path}`;
}

// Билдер URL для разных типов контента
export const urlBuilders = {
  home: (locale?: Locale) => {
    if (!locale) return SITEMAP_CONFIG.BASE_URL;
    return buildCanonicalUrl('', locale);
  },
  
  prompt: (slug: string, locale: Locale) => {
    return buildCanonicalUrl(`/prompt/${slug}`, locale);
  },
  
  category: (category: string, locale: Locale) => {
    return buildCanonicalUrl(`/category/${encodeURIComponent(category)}`, locale);
  },
  
  tag: (tag: string, locale: Locale) => {
    return buildCanonicalUrl(`/tag/${encodeURIComponent(tag)}`, locale);
  },
} as const;

// Генерация hreflang блоков
export function generateHreflangLinks(
  basePath: string,
  locales: Locale[],
  xDefaultLocale: Locale = 'en'
): string {
  const links = locales.map(locale => {
    const url = buildCanonicalUrl(basePath, locale);
    return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${url}" />`;
  });
  
  // Добавляем x-default
  const xDefaultUrl = buildCanonicalUrl(basePath, xDefaultLocale);
  links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />`);
  
  return links.join('\n');
}

// XML шаблоны
export const XML_TEMPLATES = {
  sitemapIndex: (sitemaps: Array<{ loc: string; lastmod: string }>) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="${XML_NAMESPACES.sitemap}">
${sitemaps.map(s => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`,

  urlSet: (urls: Array<{
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
    hreflang?: string;
  }>) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${XML_NAMESPACES.sitemap}" xmlns:xhtml="${XML_NAMESPACES.xhtml}">
${urls.map(url => {
  const hreflang = url.hreflang ? `\n${url.hreflang}` : '';
  return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${hreflang}
  </url>`;
}).join('\n')}
</urlset>`,
} as const;

// Получение данных из БД
export async function getSitemapData() {
  // Получаем все промпты с их метаданными
  const prompts = await prisma.prompt.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
      lang: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Извлекаем уникальные категории
  const categories = Array.from(new Set(prompts.map(p => p.category)))
    .filter(Boolean)
    .map(category => ({
      name: category,
      lastmod: new Date(), // Будем обновлять на основе промптов
    }));

  // Извлекаем уникальные теги
  const allTags = prompts
    .flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
    .filter(Boolean);
  
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Фильтруем теги с ≥1 промптом
  const tags = Object.entries(tagCounts)
    .filter(([, count]) => count >= 1)
    .map(([name]) => ({
      name,
      lastmod: new Date(), // Будем обновлять на основе промптов
    }));

  return {
    prompts,
    categories,
    tags,
  };
}

// Получение lastmod для категории на основе промптов
export async function getCategoryLastMod(category: string): Promise<Date> {
  const result = await prisma.prompt.aggregate({
    where: { category },
    _max: { updatedAt: true },
  });
  
  return result._max.updatedAt || new Date();
}

// Получение lastmod для тега на основе промптов
export async function getTagLastMod(tag: string): Promise<Date> {
  const result = await prisma.prompt.aggregate({
    where: {
      tags: {
        contains: tag,
      },
    },
    _max: { updatedAt: true },
  });
  
  return result._max.updatedAt || new Date();
}

// Пагинация промптов
export async function getPromptsPage(page: number, limit: number = SITEMAP_CONFIG.PROMPTS_PER_PAGE) {
  const skip = (page - 1) * limit;
  
  const prompts = await prisma.prompt.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
      lang: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.prompt.count();
  
  return {
    prompts,
    total,
    hasMore: skip + prompts.length < total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

// Валидация URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Очистка и валидация данных sitemap
export function validateSitemapData(urls: Array<{ loc: string; [key: string]: any }>) {
  const validUrls = urls.filter(url => {
    if (!url.loc || !isValidUrl(url.loc)) {
      console.warn(`Invalid URL in sitemap: ${url.loc}`);
      return false;
    }
    return true;
  });

  // Проверка на дубликаты
  const uniqueUrls = new Set(validUrls.map(url => url.loc));
  if (uniqueUrls.size !== validUrls.length) {
    console.warn('Duplicate URLs found in sitemap');
  }

  return validUrls;
}

// Генерация slug из строки
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Кэширование с TTL
const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number = SITEMAP_CONFIG.REVALIDATE_TIME): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.data);
  }
  
  return fetcher().then(data => {
    cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
    return data;
  });
}

// Очистка кэша
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}
