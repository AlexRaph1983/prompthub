import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Создать промпт и автоматически обновить счётчик категории
 * Атомарная операция в транзакции
 */
export async function createPromptAndSync(data: Prisma.PromptCreateInput) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.prompt.create({ data })
    
    // Если указана категория, увеличиваем счётчик
    if (created.categoryId) {
      await tx.category.update({
        where: { id: created.categoryId },
        data: { promptCount: { increment: 1 } }
      })
    }
    
    return created
  })
}

/**
 * Обновить промпт и синхронизировать счётчики категорий
 * При смене categoryId: старая категория -1, новая +1
 */
export async function updatePromptAndSync(
  where: Prisma.PromptWhereUniqueInput,
  data: Prisma.PromptUpdateInput
) {
  return prisma.$transaction(async (tx) => {
    // Получаем текущее состояние
    const prev = await tx.prompt.findUnique({
      where,
      select: { id: true, categoryId: true }
    })
    
    if (!prev) {
      throw new Error(`Prompt not found: ${JSON.stringify(where)}`)
    }
    
    // Обновляем промпт
    const updated = await tx.prompt.update({
      where,
      data
    })
    
    // Синхронизируем счётчики, если categoryId изменился
    if (prev.categoryId !== updated.categoryId) {
      // Уменьшаем счётчик старой категории
      if (prev.categoryId) {
        await tx.category.update({
          where: { id: prev.categoryId },
          data: { promptCount: { decrement: 1 } }
        }).catch(() => {
          // Игнорируем ошибку если категория удалена
        })
      }
      
      // Увеличиваем счётчик новой категории
      if (updated.categoryId) {
        await tx.category.update({
          where: { id: updated.categoryId },
          data: { promptCount: { increment: 1 } }
        }).catch(() => {
          // Игнорируем ошибку если категория удалена
        })
      }
    }
    
    return updated
  })
}

/**
 * Удалить промпт и автоматически обновить счётчик категории
 * Атомарная операция в транзакции
 */
export async function deletePromptAndSync(where: Prisma.PromptWhereUniqueInput) {
  return prisma.$transaction(async (tx) => {
    // Получаем данные перед удалением
    const prev = await tx.prompt.findUnique({
      where,
      select: { id: true, categoryId: true }
    })
    
    if (!prev) {
      throw new Error(`Prompt not found: ${JSON.stringify(where)}`)
    }
    
    // Удаляем промпт
    const deleted = await tx.prompt.delete({ where })
    
    // Уменьшаем счётчик категории
    if (prev.categoryId) {
      await tx.category.update({
        where: { id: prev.categoryId },
        data: { promptCount: { decrement: 1 } }
      }).catch(() => {
        // Игнорируем ошибку если категория удалена
      })
    }
    
    return deleted
  })
} 