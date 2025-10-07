import { describe, it, expect, beforeEach } from 'vitest';
import { getCategoryDisplayName, getCategoriesTree, getCategoryBySlug } from '@/lib/categories';
import type { CategoryWithChildren } from '@/lib/categories';

describe('Categories', () => {
  const mockCategory: CategoryWithChildren = {
    id: '1',
    nameRu: 'Промпты для юристов',
    nameEn: 'Legal',
    slug: 'legal',
    descriptionRu: 'Описание на русском',
    descriptionEn: 'Description in English',
    parentId: null,
    isActive: true,
    sortOrder: 1,
    promptCount: 10,
    children: []
  };

  describe('getCategoryDisplayName', () => {
    it('should return Russian name for ru locale', () => {
      const result = getCategoryDisplayName(mockCategory, 'ru');
      expect(result.name).toBe('Промпты для юристов');
      expect(result.description).toBe('Описание на русском');
    });

    it('should return English name for en locale', () => {
      const result = getCategoryDisplayName(mockCategory, 'en');
      expect(result.name).toBe('Legal');
      expect(result.description).toBe('Description in English');
    });
  });

  describe('URL utilities', () => {
    it('should create category URL correctly', () => {
      const { createCategoryUrl } = require('@/lib/url');
      expect(createCategoryUrl('legal', 'ru')).toBe('/ru/category/legal');
      expect(createCategoryUrl('design', 'en')).toBe('/en/category/design');
    });

    it('should create prompts URL with filters', () => {
      const { createPromptsUrl } = require('@/lib/url');
      const url = createPromptsUrl('ru', { category: 'legal', tag: 'chatgpt' });
      expect(url).toBe('/ru/prompts?category=legal&tag=chatgpt');
    });
  });

  describe('SEO utilities', () => {
    it('should generate category metadata', () => {
      const { generateCategoryMetadata } = require('@/lib/seo');
      const metadata = generateCategoryMetadata(mockCategory, 'ru', 'https://example.com');
      
      expect(metadata.title).toBe('Промпты для юристов — PromptHub');
      expect(metadata.description).toBe('Описание на русском');
      expect(metadata.alternates?.canonical).toBe('https://example.com/ru/category/legal');
    });

    it('should generate structured data', () => {
      const { generateCategoryStructuredData } = require('@/lib/seo');
      const structuredData = generateCategoryStructuredData(mockCategory, 'ru', 'https://example.com');
      
      expect(structuredData['@type']).toBe('CollectionPage');
      expect(structuredData.name).toBe('Промпты для юристов');
      expect(structuredData.url).toBe('https://example.com/ru/category/legal');
    });
  });

  describe('Filter utilities', () => {
    it('should parse filters from URL', () => {
      const { parseFiltersFromUrl } = require('@/lib/filters');
      const searchParams = new URLSearchParams('category=legal&tag=chatgpt&nsfw=true');
      const filters = parseFiltersFromUrl(searchParams);
      
      expect(filters.category).toBe('legal');
      expect(filters.tag).toBe('chatgpt');
      expect(filters.nsfw).toBe(true);
    });

    it('should create URL params from filters', () => {
      const { createUrlParams } = require('@/lib/filters');
      const filters = { category: 'legal', tag: 'chatgpt', nsfw: true };
      const params = createUrlParams(filters);
      
      expect(params.get('category')).toBe('legal');
      expect(params.get('tag')).toBe('chatgpt');
      expect(params.get('nsfw')).toBe('true');
    });

    it('should validate filters correctly', () => {
      const { validateFilters } = require('@/lib/filters');
      const invalidFilters = { page: -1, search: 'a' };
      const validated = validateFilters(invalidFilters);
      
      expect(validated.page).toBeUndefined();
      expect(validated.search).toBeUndefined();
    });
  });
});
