import { describe, it, expect } from 'vitest';
import { resolveLocale } from '@/i18n/index';

describe('resolveLocale', () => {
  it('uses cookie when present and valid', () => {
    expect(resolveLocale('ru', 'en-US,en;q=0.9')).toBe('ru');
    expect(resolveLocale('en', 'ru-RU,ru;q=0.9')).toBe('en');
  });

  it('falls back to Accept-Language when cookie missing', () => {
    expect(resolveLocale(undefined, 'ru-RU,ru;q=0.9')).toBe('ru');
    expect(resolveLocale(undefined, 'en-US,en;q=0.9')).toBe('en');
  });

  it('defaults to en when header is unknown', () => {
    expect(resolveLocale(undefined, 'de-DE,de;q=0.9')).toBe('en');
  });
});


