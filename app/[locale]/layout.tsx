import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/index';
import AuthProvider from '@/components/AuthProvider';
import { PromptProvider } from '@/contexts/PromptStore';
import { Navigation } from '@/components/Navigation';
import { AddPromptModal } from '@/components/AddPromptModal';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() { return locales.map((l) => ({ locale: l })); }

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: Locale };
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = params;
  const host = process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000';
  const messages = (await import(`@/messages/${locale}.json`)).default as any;
  const title = messages?.metadata?.title || 'PromptHub';
  const description = messages?.metadata?.description || '';

  return {
    metadataBase: new URL(host),
    title,
    description,
    alternates: {
      canonical: `${host}/${locale}`,
      languages: {
        en: `${host}/en`,
        ru: `${host}/ru`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${host}/${locale}`,
      siteName: 'PromptHub',
      locale,
      type: 'website',
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = params;
  if (!locales.includes(locale)) notFound();

  const messages = (await import(`@/messages/${locale}.json`)).default as any;

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <PromptProvider>
              <Navigation />
              <div className="min-h-screen">
                {children}
              </div>
              <AddPromptModal />
            </PromptProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


