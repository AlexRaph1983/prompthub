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

      // ПРИОРИТЕТ 3: fallback к полю views в таблице prompt (основной источник)
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { views: true }
      })
      
      if (prompt?.views && prompt.views > 0) {
        return prompt.views
      }

      // ПРИОРИТЕТ 4: promptInteraction (только если нет данных в основных источниках)
      const interactions = await prisma.promptInteraction.count({
        where: { promptId, type: { in: ['view', 'open'] } }
      })
      
      return interactions
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
      // Используем ТОЧНО ТУ ЖЕ ЛОГИКУ, что и getPromptViews
      for (const promptId of promptIds) {
        const views = await this.getPromptViews(promptId)
        viewTotals.set(promptId, views)
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
