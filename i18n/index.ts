export const locales = ['en', 'ru'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'ru';
export const localeCookieName = 'locale';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function resolveLocale(
  cookieLocale: string | undefined | null,
  acceptLanguageHeader: string | undefined | null
): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;

  const header = (acceptLanguageHeader || '').toLowerCase();
  if (header.startsWith('ru')) return 'ru';
  return defaultLocale;
}

export function getPathWithLocale(pathname: string, locale: Locale): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const [, seg] = normalized.split('/');
  if (isLocale(seg)) {
    return `/${locale}${normalized.slice(3)}`; // replace existing locale segment
  }
  return `/${locale}${normalized}`;
}
