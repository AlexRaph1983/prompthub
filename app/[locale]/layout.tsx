import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/index';
import AuthProvider from '@/components/AuthProvider';
import { PromptProvider } from '@/contexts/PromptStore';
import { Navigation } from '@/components/Navigation';
import { AddPromptModal } from '@/components/AddPromptModal';
import { ClientProviders } from '@/components/ClientProviders';
import CookieConsent from '@/components/CookieConsent';
import Footer from '@/components/Footer';
import Script from 'next/script';
import { ScrollRestoration } from '@/components/ScrollRestoration';
import { Snowflakes } from '@/components/Snowflakes';
import { SnowProvider } from '@/contexts/SnowContext';
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() { return locales.map((l) => ({ locale: l })); }

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: Locale };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = params;
  const host = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const messages = (await import(`@/messages/${locale}.json`)).default as any;
  const title = messages?.metadata?.title || 'PromptHub';
  const description = messages?.metadata?.description || '';
  const keywords = messages?.metadata?.keywords || '';
  const ogImage = messages?.metadata?.ogImage || '/og/prompt-hub.png';

  return {
    metadataBase: new URL(host),
    title,
    description,
    keywords,
    alternates: {
      canonical: `${host}/${locale}`,
      languages: { en: `${host}/en`, ru: `${host}/ru` },
    },
    openGraph: { title, description, url: `${host}/${locale}`, siteName: 'PromptHub', locale, type: 'website', images: [{ url: ogImage }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    robots: { index: true, follow: true },
    icons: { 
      icon: [
        { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-120x120.svg', sizes: '120x120', type: 'image/svg+xml' }
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
      ]
    },
    other: {
      'preconnect': 'https://fonts.googleapis.com',
      'preconnect-gstatic': 'https://fonts.gstatic.com',
      'manifest': '/manifest.json'
    }
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = params;
  if (!locales.includes(locale)) notFound();

	// Ensure static rendering works with next-intl in App Router
	unstable_setRequestLocale(locale);

  const messages = (await import(`@/messages/${locale}.json`)).default as any;

  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang = '${locale}';`
      }} />
      {/* Yandex.Metrika */}
      <Script id="yandex-metrika" strategy="afterInteractive">{`
        (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104142063', 'ym');
        ym(104142063, 'init', { ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true });
      `}</Script>
      <noscript><div><img src="https://mc.yandex.ru/watch/104142063" style={{position:'absolute', left:'-9999px'}} alt="" /></div></noscript>

      <ClientProviders>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <PromptProvider>
              <SnowProvider>
                {/* Глобальный фон (за снегом и контентом) */}
                <div aria-hidden className="fixed inset-0 z-0 bg-gray-50 dark:bg-gray-900" />

                {/* Снег должен быть поверх фона, но за блоками */}
                <Snowflakes />

                <div className="relative z-10">
                  <ScrollRestoration />
                  <Navigation />
                  <div className="min-h-screen">
                    {children}
                  </div>
                  <Footer />
                  <AddPromptModal />
                  <CookieConsent />
                </div>
              </SnowProvider>
            </PromptProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </ClientProviders>
    </>
  );
}