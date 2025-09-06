import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { resolveLocale } from '@/i18n/index';

export default function Page() {
  const cookieStore = cookies();
  const acceptLanguage = headers().get('accept-language');
  const cookieLocale = cookieStore.get('locale')?.value;
  const locale = resolveLocale(cookieLocale, acceptLanguage);
  redirect(`/${locale}/home`);
}