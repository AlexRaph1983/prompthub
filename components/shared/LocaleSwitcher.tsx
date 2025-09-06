'use client';

import React, { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getPathWithLocale, isLocale, localeCookieName, type Locale } from '@/i18n/index';

export function buildPathWithLocalePreservingQuery(pathname: string, locale: Locale, searchParams: URLSearchParams): string {
  const base = getPathWithLocale(pathname, locale);
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

export default function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const otherLocale: Locale = useMemo(() => (currentLocale === 'ru' ? 'en' : 'ru'), [currentLocale]);
  const label = useMemo(() => (currentLocale === 'ru' ? 'RU' : 'EN'), [currentLocale]);

  const handleChange = useCallback(
    (next: Locale) => {
      const nextPath = buildPathWithLocalePreservingQuery(pathname || '/', next, new URLSearchParams(searchParams as any));
      // persist cookie
      document.cookie = `${localeCookieName}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.push(nextPath);
    },
    [pathname, router, searchParams]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Change language" className="px-2">
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-28" role="menu" aria-label="Select language">
        <DropdownMenuItem role="menuitem" onClick={() => handleChange(otherLocale)}>
          {otherLocale.toUpperCase()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


