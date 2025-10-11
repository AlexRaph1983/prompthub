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

  // 2) Делегируем обработку next-intl middleware
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api|assets|.*\\..*).*)']
}


