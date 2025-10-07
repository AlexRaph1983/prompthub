import { getNavigationCategories } from '@/lib/categories';
import CategoryNav from './CategoryNav';
import type { Locale } from '@/i18n/index';

interface CategoryNavServerProps {
  locale: Locale;
  currentCategory?: string;
}

export default async function CategoryNavServer({ locale, currentCategory }: CategoryNavServerProps) {
  const categories = await getNavigationCategories(locale);
  
  return <CategoryNav locale={locale} categories={categories} currentCategory={currentCategory} />;
}
