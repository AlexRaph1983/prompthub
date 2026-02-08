import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/index'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

const PUBLIC_FILE = /\.(.*)$/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const canonicalHost = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'
  let canonicalUrl: URL | null = null
  try {
    canonicalUrl = new URL(canonicalHost)
  } catch {
    canonicalUrl = null
  }

  const host = request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const requestProto = forwardedProto || request.nextUrl.protocol.replace(':', '')
  const isLocalhost = host?.includes('localhost') || host?.startsWith('127.0.0.1')

  if (canonicalUrl && host && !isLocalhost) {
    const canonicalProto = canonicalUrl.protocol.replace(':', '')
    const needsHost = host !== canonicalUrl.host
    const needsProto = canonicalProto && requestProto && requestProto !== canonicalProto

    if (needsHost || needsProto) {
      const url = request.nextUrl.clone()
      url.host = canonicalUrl.host
      url.protocol = canonicalUrl.protocol
      return NextResponse.redirect(url, 308)
    }
  }

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

  // If the path already includes a locale prefix, skip next-intl middleware
  // to avoid redirect loops between /ru/* and non-prefixed routes.
  if (
    pathname === '/ru' ||
    pathname.startsWith('/ru/') ||
    pathname === '/en' ||
    pathname.startsWith('/en/')
  ) {
    return NextResponse.next()
  }

  // 2.5) Канонизация публичных URL без префикса локали -> /ru/...
  if (!pathname.startsWith('/ru/') && !pathname.startsWith('/en/')) {
    const isPublic =
      pathname === '/home' ||
      pathname === '/prompts' ||
      pathname === '/leaders' ||
      pathname === '/privacy' ||
      pathname === '/articles' ||
      pathname === '/biblioteka-promtov' ||
      pathname === '/baza-promtov' ||
      pathname === '/katalog-promtov' ||
      pathname === '/marketpleys-promtov' ||
      pathname.startsWith('/prompt/')

    if (isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = `/ru${pathname}`
      return NextResponse.redirect(url, 308)
    }
  }

  // 3) Делегируем обработку next-intl middleware для остальных случаев
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api|assets|.*\\..*).*)']
}


