import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'

export default function LocaleIndex({ params }: { params: { locale: string } }) {
  // Редиректим на главную страницу с контентом
  redirect(`/${params.locale}/home`);
}


