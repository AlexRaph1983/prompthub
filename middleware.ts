import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/index'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

const PUBLIC_FILE = /\.(.*)$/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1) Пропускаем служебные и статические пути
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  // 2) Оптимизация: избегаем множественных редиректов
  // Если запрос идет на корень, сразу редиректим на локализованную версию
  if (pathname === '/') {
    const locale = defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url))
  }

  // 3) Делегируем обработку next-intl middleware для остальных случаев
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api|assets|.*\\..*).*)']
}


