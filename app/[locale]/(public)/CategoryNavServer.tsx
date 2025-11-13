import CategoryNav from './CategoryNav';
import type { Locale } from '@/i18n/index';

interface CategoryNavServerProps {
  locale: Locale;
  currentCategory?: string;
}

interface CategoryNode {
  id: string;
  name: string;
  nameRu: string;
  nameEn: string;
  slug: string;
  promptCount: number;
  sortOrder: number;
  parentId: string | null;
  isActive: boolean;
  children: CategoryNode[];
}

export default async function CategoryNavServer({ locale, currentCategory }: CategoryNavServerProps) {
  try {
    // Получаем категории из API (теперь возвращает иерархическое дерево с кэшированными счётчиками)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'}/api/categories`, 
      {
        next: { revalidate: 60 } // Кэшируем на 60 секунд
      }
    );
    
    if (!response.ok) {
      console.error('[CategoryNavServer] Failed to fetch categories:', response.status);
      return <CategoryNav locale={locale} categories={[]} currentCategory={currentCategory} />;
    }
    
    const categories: CategoryNode[] = await response.json();
    
    // Преобразуем формат для компонента CategoryNav
    // API уже возвращает полное дерево с children, просто маппим поля
    const formattedCategories = categories.map((cat: CategoryNode) => ({
      id: cat.slug, // Для обратной совместимости используем slug как id
      name: cat.name,
      nameRu: cat.nameRu,
      nameEn: cat.nameEn,
      slug: cat.slug,
      promptCount: cat.promptCount, // Теперь из кэша, не подсчитывается на лету
      isActive: cat.isActive,
      children: cat.children.map((child: CategoryNode) => ({
        id: child.slug,
        name: child.name,
        nameRu: child.nameRu,
        nameEn: child.nameEn,
        slug: child.slug,
        promptCount: child.promptCount,
        isActive: child.isActive,
        children: [] // Поддерживаем только 2 уровня
      }))
    }));
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CategoryNavServer] Loaded', formattedCategories.length, 'root categories');
    }
    
    return <CategoryNav locale={locale} categories={formattedCategories} currentCategory={currentCategory} />;
  } catch (error) {
    console.error('[CategoryNavServer] Error fetching categories:', error);
    return <CategoryNav locale={locale} categories={[]} currentCategory={currentCategory} />;
  }
}
