import { prisma } from './prisma';
import type { Locale } from '@/i18n/index';

export interface CategoryWithChildren {
  id: string;
  nameRu: string;
  nameEn: string;
  slug: string;
  descriptionRu?: string;
  descriptionEn?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  promptCount: number;
  children?: CategoryWithChildren[];
}

export interface CategoryDisplayName {
  name: string;
  description?: string;
}

/**
 * Получить отображаемое название категории по локали
 */
export function getCategoryDisplayName(
  category: CategoryWithChildren,
  locale: Locale
): CategoryDisplayName {
  const name = locale === 'ru' ? category.nameRu : category.nameEn;
  const description = locale === 'ru' ? category.descriptionRu : category.descriptionEn;
  
  return { name, description };
}

/**
 * Получить дерево категорий с детьми
 */
export async function getCategoriesTree(locale: Locale): Promise<CategoryWithChildren[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [
      { parentId: 'asc' },
      { sortOrder: 'asc' },
      { nameRu: 'asc' }
    ],
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  // Группируем по родительским категориям
  const parentCategories = categories.filter(cat => !cat.parentId);
  const childCategories = categories.filter(cat => cat.parentId);

  return parentCategories.map(parent => ({
    ...parent,
    children: childCategories
      .filter(child => child.parentId === parent.id)
      .map(child => ({
        ...child,
        children: []
      }))
  }));
}

/**
 * Получить категорию по слагу
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryWithChildren | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!category) return null;

  return {
    ...category,
    children: category.children.map(child => ({
      ...child,
      children: []
    }))
  };
}

/**
 * Получить популярные теги для категории
 */
export async function getPopularTagsForCategory(
  categoryId: string,
  limit: number = 10
): Promise<Array<{ id: string; name: string; slug: string; count: number }>> {
  const tags = await prisma.tag.findMany({
    where: {
      isActive: true,
      promptTags: {
        some: {
          prompt: {
            categoryId
          }
        }
      }
    },
    include: {
      _count: {
        select: {
          promptTags: {
            where: {
              prompt: {
                categoryId
              }
            }
          }
        }
      }
    },
    orderBy: {
      promptTags: {
        _count: 'desc'
      }
    },
    take: limit
  });

  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    count: tag._count.promptTags
  }));
}

/**
 * Получить количество промптов в категории
 */
export async function getCategoryPromptCount(categoryId: string): Promise<number> {
  return await prisma.prompt.count({
    where: { categoryId }
  });
}

/**
 * Обновить кэш количества промптов для всех категорий
 */
export async function updateCategoryPromptCounts(): Promise<void> {
  const categories = await prisma.category.findMany({
    select: { id: true }
  });

  for (const category of categories) {
    const count = await getCategoryPromptCount(category.id);
    await prisma.category.update({
      where: { id: category.id },
      data: { promptCount: count }
    });
  }
}

/**
 * Получить категории для навигации (только родительские)
 */
export async function getNavigationCategories(locale: Locale): Promise<CategoryWithChildren[]> {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  return categories.map(category => ({
    ...category,
    children: category.children.map(child => ({
      ...child,
      children: []
    }))
  }));
}
