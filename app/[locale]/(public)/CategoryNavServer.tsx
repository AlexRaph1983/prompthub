import CategoryNav from './CategoryNav';
import type { Locale } from '@/i18n/index';

interface CategoryNavServerProps {
  locale: Locale;
  currentCategory?: string;
}

export default async function CategoryNavServer({ locale, currentCategory }: CategoryNavServerProps) {
  try {
    // Получаем категории из нашего API с принудительным обновлением
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'}/api/categories?t=${Date.now()}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
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
      nameRu: cat.nameRu,
      nameEn: cat.nameEn,
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
