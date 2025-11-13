import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authFromRequest } from '@/lib/auth';

/**
 * Админ эндпоинт для пересчёта счётчиков промптов в категориях
 * POST /api/admin/recount-categories
 * 
 * Требует права администратора
 * 
 * Алгоритм:
 * 1. Обнуляет все Category.promptCount = 0
 * 2. Считает Prompt по categoryId через groupBy
 * 3. Батчем обновляет соответствующие категории
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем права администратора
    const user = await authFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('[Recount Categories] Starting recount by admin:', user.email);

    // Шаг 1: Обнуляем все счётчики
    const resetResult = await prisma.category.updateMany({
      data: { promptCount: 0 }
    });

    console.log('[Recount Categories] Reset all counters:', resetResult.count);

    // Шаг 2: Группируем промпты по категориям
    const grouped = await prisma.prompt.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: {
        categoryId: { not: null }
      }
    });

    console.log('[Recount Categories] Found', grouped.length, 'categories with prompts');

    // Шаг 3: Обновляем счётчики батчем в транзакции
    if (grouped.length > 0) {
      await prisma.$transaction(
        grouped
          .filter(g => g.categoryId !== null)
          .map(g =>
            prisma.category.update({
              where: { id: g.categoryId! },
              data: { promptCount: g._count._all }
            })
          )
      );
    }

    // Получаем итоговую статистику
    const finalStats = await prisma.category.findMany({
      select: {
        id: true,
        slug: true,
        nameRu: true,
        nameEn: true,
        promptCount: true
      },
      orderBy: { promptCount: 'desc' },
      take: 20
    });

    console.log('[Recount Categories] Completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Category prompt counts recalculated successfully',
      stats: {
        categoriesReset: resetResult.count,
        categoriesUpdated: grouped.length,
        topCategories: finalStats.slice(0, 10)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Recount Categories] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to recount categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

