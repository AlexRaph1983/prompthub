import { prisma } from '@/lib/prisma'

/**
 * Единый сервис для подсчета просмотров промптов
 * Использует единую логику приоритетов для всех API
 */
export class ViewsService {
  /**
   * Получить количество просмотров для одного промпта
   */
  static async getPromptViews(promptId: string): Promise<number> {
    try {
      // ПРИОРИТЕТ 1: viewAnalytics (самый точный источник)
      const analytics = await prisma.viewAnalytics.findFirst({
        where: { promptId },
        select: { countedViews: true }
      })
      
      if (analytics?.countedViews && analytics.countedViews > 0) {
        return analytics.countedViews
      }

      // ПРИОРИТЕТ 2: promptViewEvent (события просмотров)
      const viewEvents = await prisma.promptViewEvent.count({
        where: { promptId, isCounted: true }
      })
      
      if (viewEvents > 0) {
        return viewEvents
      }

      // ПРИОРИТЕТ 3: promptInteraction (взаимодействия типа view/open)
      const interactions = await prisma.promptInteraction.count({
        where: { promptId, type: { in: ['view', 'open'] } }
      })
      
      if (interactions > 0) {
        return interactions
      }

      // ПРИОРИТЕТ 4: fallback к полю views в таблице prompt
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { views: true }
      })
      
      return prompt?.views || 0
    } catch (error) {
      console.error('Error getting prompt views:', error)
      return 0
    }
  }

  /**
   * Получить количество просмотров для множества промптов
   * Оптимизированная версия для списков
   */
  static async getPromptsViews(promptIds: string[]): Promise<Map<string, number>> {
    const viewTotals = new Map<string, number>()
    
    if (promptIds.length === 0) {
      return viewTotals
    }

    try {
      // ПРИОРИТЕТ 1: viewAnalytics для всех промптов
      const analytics = await prisma.viewAnalytics.groupBy({
        by: ['promptId'],
        where: { promptId: { in: promptIds } },
        _sum: { countedViews: true },
      })
      
      for (const row of analytics) {
        if (row._sum.countedViews && row._sum.countedViews > 0) {
          viewTotals.set(row.promptId, row._sum.countedViews)
        }
      }

      // ПРИОРИТЕТ 2: promptViewEvent для оставшихся
      const missingIds = promptIds.filter(id => !viewTotals.has(id))
      if (missingIds.length > 0) {
        const viewEvents = await prisma.promptViewEvent.groupBy({
          by: ['promptId'],
          where: { promptId: { in: missingIds }, isCounted: true },
          _count: { _all: true },
        })
        
        for (const row of viewEvents) {
          if (row._count._all && row._count._all > 0) {
            viewTotals.set(row.promptId, row._count._all)
          }
        }
      }

      // ПРИОРИТЕТ 3: promptInteraction для оставшихся
      const stillMissingIds = promptIds.filter(id => !viewTotals.has(id))
      if (stillMissingIds.length > 0) {
        const interactions = await prisma.promptInteraction.groupBy({
          by: ['promptId'],
          where: { promptId: { in: stillMissingIds }, type: { in: ['view', 'open'] } },
          _count: { _all: true },
        })
        
        for (const row of interactions) {
          if (row._count._all && row._count._all > 0) {
            viewTotals.set(row.promptId, row._count._all)
          }
        }
      }

      // ПРИОРИТЕТ 4: fallback к полю views в таблице prompt
      const finalMissingIds = promptIds.filter(id => !viewTotals.has(id))
      if (finalMissingIds.length > 0) {
        const prompts = await prisma.prompt.findMany({
          where: { id: { in: finalMissingIds } },
          select: { id: true, views: true }
        })
        
        for (const prompt of prompts) {
          if (prompt.views && prompt.views > 0) {
            viewTotals.set(prompt.id, prompt.views)
          }
        }
      }

      // Для промптов без просмотров устанавливаем 0
      for (const promptId of promptIds) {
        if (!viewTotals.has(promptId)) {
          viewTotals.set(promptId, 0)
        }
      }

      return viewTotals
    } catch (error) {
      console.error('Error getting prompts views:', error)
      // В случае ошибки возвращаем 0 для всех промптов
      for (const promptId of promptIds) {
        viewTotals.set(promptId, 0)
      }
      return viewTotals
    }
  }
}
