import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatLastMod,
  buildCanonicalUrl,
  urlBuilders,
  generateHreflangLinks,
  generateSlug,
  isValidUrl,
  validateSitemapData,
  SITEMAP_CONFIG,
} from '@/lib/sitemap';

describe('Sitemap Utils', () => {
  describe('formatLastMod', () => {
    it('should format date to ISO 8601', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatLastMod(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('buildCanonicalUrl', () => {
    it('should build URL without locale', () => {
      const result = buildCanonicalUrl('/test');
      expect(result).toBe('https://prompt-hub.site/test');
    });

    it('should build URL with locale', () => {
      const result = buildCanonicalUrl('/test', 'ru');
      expect(result).toBe('https://prompt-hub.site/ru/test');
    });
  });

  describe('urlBuilders', () => {
    it('should build home URL without locale', () => {
      const result = urlBuilders.home();
      expect(result).toBe('https://prompt-hub.site');
    });

    it('should build home URL with locale', () => {
      const result = urlBuilders.home('ru');
      expect(result).toBe('https://prompt-hub.site/ru');
    });

    it('should build prompt URL', () => {
      const result = urlBuilders.prompt('test-prompt', 'en');
      expect(result).toBe('https://prompt-hub.site/en/prompt/test-prompt');
    });

    it('should build category URL', () => {
      const result = urlBuilders.category('AI Tools', 'ru');
      expect(result).toBe('https://prompt-hub.site/ru/category/AI%20Tools');
    });

    it('should build tag URL', () => {
      const result = urlBuilders.tag('chatgpt', 'en');
      expect(result).toBe('https://prompt-hub.site/en/tag/chatgpt');
    });
  });

  describe('generateHreflangLinks', () => {
    it('should generate hreflang links for locales', () => {
      const result = generateHreflangLinks('/test', ['ru', 'en'], 'en');
      expect(result).toContain('hreflang="ru"');
      expect(result).toContain('hreflang="en"');
      expect(result).toContain('hreflang="x-default"');
    });

    it('should include correct URLs in hreflang', () => {
      const result = generateHreflangLinks('/test', ['ru', 'en'], 'en');
      expect(result).toContain('https://prompt-hub.site/ru/test');
      expect(result).toContain('https://prompt-hub.site/en/test');
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slug from text', () => {
      const result = generateSlug('Test Prompt Title!');
      expect(result).toBe('test-prompt-title');
    });

    it('should handle special characters', () => {
      const result = generateSlug('AI & Machine Learning (2024)');
      expect(result).toBe('ai-machine-learning-2024');
    });

    it('should handle multiple spaces and hyphens', () => {
      const result = generateSlug('Test   --  Multiple   Spaces');
      expect(result).toBe('test-multiple-spaces');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://prompt-hub.site/test')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://invalid')).toBe(false);
    });
  });

  describe('validateSitemapData', () => {
    it('should filter out invalid URLs', () => {
      const urls = [
        { loc: 'https://valid.com', priority: '1.0' },
        { loc: 'invalid-url', priority: '0.8' },
        { loc: 'https://another-valid.com', priority: '0.9' },
      ];

      const result = validateSitemapData(urls);
      expect(result).toHaveLength(2);
      expect(result[0].loc).toBe('https://valid.com');
      expect(result[1].loc).toBe('https://another-valid.com');
    });

    it('should handle empty array', () => {
      const result = validateSitemapData([]);
      expect(result).toHaveLength(0);
    });
  });
});
