import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Кэш для статистики (5 минут)
let statsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Проверяем кэш (если не принудительное обновление)
    const now = Date.now();
    if (!forceRefresh && statsCache && (now - statsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...statsCache.data,
        cached: true,
        cacheAge: Math.round((now - statsCache.timestamp) / 1000)
      });
    }

    // Если принудительное обновление, очищаем кэш
    if (forceRefresh) {
      statsCache = null;
    }


    // Получаем статистику с единым источником просмотров
    const [
      totalUsers,
      totalActiveUsers,
      totalPrompts,
      totalRatings,
      totalReviews
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          AND: [
            { email: { not: { contains: 'music.com' } } },
            { email: { not: { contains: 'test' } } },
            { email: { not: { contains: 'example' } } },
            { name: { not: { contains: 'Music Lover' } } }
          ]
        }
      }),
      prisma.prompt.count(),
      prisma.rating.count(),
      prisma.review.count()
    ]);

    // Получаем все id промптов
    const allPromptIds = await prisma.prompt.findMany({ select: { id: true } });
    const promptIds = allPromptIds.map(p => p.id);
    // Получаем просмотры через ViewsService
    const { ViewsService } = await import('@/lib/services/viewsService');
    const viewsMap = await ViewsService.getPromptsViews(promptIds);
    const totalViews = Array.from(viewsMap.values()).reduce((sum, v) => sum + v, 0);

    const stats = {
      users: totalActiveUsers,
      prompts: totalPrompts,
      views: totalViews,
      ratings: totalRatings,
      reviews: totalReviews,
      timestamp: new Date().toISOString()
    };

    // Обновляем кэш
    statsCache = {
      data: stats,
      timestamp: now
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Возвращаем кэшированные данные в случае ошибки
    if (statsCache) {
      return NextResponse.json({
        ...statsCache.data,
        cached: true,
        error: 'Using cached data due to error'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
