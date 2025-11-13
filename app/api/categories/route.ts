import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const validateCounts = process.env.CATEGORIES_VALIDATE_COUNTS === 'true';
    
    // Единственный запрос к БД - получаем все категории с кэшированными счётчиками
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        slug: true,
        parentId: true,
        promptCount: true,
        sortOrder: true,
        isActive: true,
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' },
        { nameRu: 'asc' }
      ],
    });

    // Строим дерево категорий
    const byId = new Map<string, CategoryNode>();
    
    // Сначала создаём все узлы
    categories.forEach(cat => {
      byId.set(cat.id, {
        id: cat.id,
        name: cat.nameEn, // Для обратной совместимости
        nameRu: cat.nameRu,
        nameEn: cat.nameEn,
        slug: cat.slug,
        promptCount: cat.promptCount,
        sortOrder: cat.sortOrder,
        parentId: cat.parentId,
        isActive: cat.isActive,
        children: []
      });
    });

    // Затем строим иерархию
    const roots: CategoryNode[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        // Добавляем в children родителя
        byId.get(node.parentId)!.children.push(node);
      } else {
        // Корневая категория
        roots.push(node);
      }
    }

    // Фоновая валидация в DEV (не блокирует ответ)
    if (validateCounts && process.env.NODE_ENV !== 'production') {
      Promise.resolve().then(async () => {
        try {
          const grouped = await prisma.prompt.groupBy({
            by: ['categoryId'],
            _count: { _all: true },
            where: { categoryId: { not: null } }
          });
          
          const countMap = new Map(grouped.map(g => [g.categoryId!, g._count._all]));
          
          for (const cat of categories) {
            const actualCount = countMap.get(cat.id) || 0;
            if (actualCount !== cat.promptCount) {
              console.warn(
                `[CATEGORIES_VALIDATE] Mismatch for ${cat.slug}: ` +
                `cached=${cat.promptCount}, actual=${actualCount}`
              );
            }
          }
        } catch (err) {
          console.error('[CATEGORIES_VALIDATE] Error:', err);
        }
      }).catch(() => {});
    }

    // Логируем источник данных в DEV
    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Categories] Source: cache, categories:', roots.length);
    }

    const response = NextResponse.json(roots);
    
    // Кэшируем на короткое время (CDN edge может кэшировать)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error('[API Categories] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}