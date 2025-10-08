import CategoryNav from './CategoryNav';
import type { Locale } from '@/i18n/index';

interface CategoryNavServerProps {
  locale: Locale;
  currentCategory?: string;
}

export default async function CategoryNavServer({ locale, currentCategory }: CategoryNavServerProps) {
  try {
    // Получаем категории из нашего API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/api/categories`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return <CategoryNav locale={locale} categories={[]} currentCategory={currentCategory} />;
    }
    
    const categories = await response.json();
    
    // Преобразуем формат для совместимости
    const formattedCategories = categories.map((cat: any) => ({
      id: cat.slug,
      name: cat.name,
      nameRu: cat.nameRu || cat.name,
      nameEn: cat.nameEn || cat.name,
      slug: cat.slug,
      promptCount: cat.count,
      isActive: true,
      children: []
    }));
    
    return <CategoryNav locale={locale} categories={formattedCategories} currentCategory={currentCategory} />;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return <CategoryNav locale={locale} categories={[]} currentCategory={currentCategory} />;
  }
}
