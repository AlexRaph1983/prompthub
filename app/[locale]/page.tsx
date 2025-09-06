import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'

export default function LocaleIndex({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/home`);
}


