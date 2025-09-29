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
      // Используем ту же логику, что и getPromptViews, но для множества промптов
      // ПРИОРИТЕТ 1: viewAnalytics для всех промптов
      const analytics = await prisma.viewAnalytics.findMany({
        where: { promptId: { in: promptIds } },
        select: { promptId: true, countedViews: true }
      })
      
      for (const row of analytics) {
        if (row.countedViews && row.countedViews > 0) {
          viewTotals.set(row.promptId, row.countedViews)
        }
      }

      // ПРИОРИТЕТ 2: promptViewEvent для оставшихся
      const missingIds = promptIds.filter(id => !viewTotals.has(id))
      if (missingIds.length > 0) {
        const viewEvents = await prisma.promptViewEvent.findMany({
          where: { promptId: { in: missingIds }, isCounted: true },
          select: { promptId: true }
        })
        
        // Группируем вручную
        const eventCounts = new Map<string, number>()
        for (const event of viewEvents) {
          eventCounts.set(event.promptId, (eventCounts.get(event.promptId) || 0) + 1)
        }
        
        for (const [promptId, count] of eventCounts) {
          if (count > 0) {
            viewTotals.set(promptId, count)
          }
        }
      }

      // ПРИОРИТЕТ 3: promptInteraction для оставшихся
      const stillMissingIds = promptIds.filter(id => !viewTotals.has(id))
      if (stillMissingIds.length > 0) {
        const interactions = await prisma.promptInteraction.findMany({
          where: { promptId: { in: stillMissingIds }, type: { in: ['view', 'open'] } },
          select: { promptId: true }
        })
        
        // Группируем вручную
        const interactionCounts = new Map<string, number>()
        for (const interaction of interactions) {
          interactionCounts.set(interaction.promptId, (interactionCounts.get(interaction.promptId) || 0) + 1)
        }
        
        for (const [promptId, count] of interactionCounts) {
          if (count > 0) {
            viewTotals.set(promptId, count)
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
