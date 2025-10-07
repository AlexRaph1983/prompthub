import { getNavigationCategories } from '@/lib/categories';
import CategoryDrawer from './CategoryDrawer';
import type { Locale } from '@/i18n/index';

interface CategoryDrawerServerProps {
  locale: Locale;
}

export default async function CategoryDrawerServer({ locale }: CategoryDrawerServerProps) {
  const categories = await getNavigationCategories(locale);
  
  return <CategoryDrawer locale={locale} categories={categories} />;
}
