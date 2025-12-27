import { describe, it, expect } from 'vitest';
import { buildCanonical, truncateTitle, truncateDescription, getBaseKeywords } from '@/lib/seo-helpers';

describe('SEO Helpers', () => {
  describe('buildCanonical', () => {
    it('строит canonical URL с локалью', () => {
      const url = buildCanonical('/prompts', 'ru');
      expect(url).toContain('/ru/prompts');
    });

    it('строит canonical URL без локали', () => {
      const url = buildCanonical('/prompts');
      expect(url).toContain('/prompts');
    });
  });

  describe('truncateTitle', () => {
    it('не обрезает короткий title', () => {
      const title = 'Short Title';
      expect(truncateTitle(title)).toBe(title);
    });

    it('обрезает длинный title до 60 символов', () => {
      const longTitle = 'A'.repeat(100);
      const truncated = truncateTitle(longTitle);
      expect(truncated.length).toBeLessThanOrEqual(63); // 60 + '...'
      expect(truncated).toEndWith('...');
    });
  });

  describe('truncateDescription', () => {
    it('не обрезает короткое описание', () => {
      const desc = 'Short description';
      expect(truncateDescription(desc)).toBe(desc);
    });

    it('обрезает длинное описание до 160 символов', () => {
      const longDesc = 'A'.repeat(200);
      const truncated = truncateDescription(longDesc);
      expect(truncated.length).toBeLessThanOrEqual(163); // 160 + '...'
      expect(truncated).toEndWith('...');
    });
  });

  describe('getBaseKeywords', () => {
    it('возвращает RU ключевые слова', () => {
      const keywords = getBaseKeywords('ru');
      expect(keywords).toContain('маркетплейс промптов');
      expect(keywords).toContain('база промптов');
    });

    it('возвращает EN ключевые слова', () => {
      const keywords = getBaseKeywords('en');
      expect(keywords).toContain('prompt marketplace');
      expect(keywords).toContain('prompt library');
    });
  });
});

