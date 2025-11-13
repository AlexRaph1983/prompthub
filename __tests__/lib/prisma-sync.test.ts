/**
 * Unit тесты для sync-хелперов в lib/prisma.ts
 * Проверяют автоматическое обновление счётчиков категорий при CRUD операциях с промптами
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createPromptAndSync, updatePromptAndSync, deletePromptAndSync } from '@/lib/prisma'

const prisma = new PrismaClient()

describe('Prisma Sync Helpers - Category Counter Management', () => {
  let testCategory1: { id: string; slug: string; promptCount: number }
  let testCategory2: { id: string; slug: string; promptCount: number }
  let testUser: { id: string }
  let testPrompt: { id: string; categoryId: string | null }

  beforeEach(async () => {
    // Создаём тестовые категории
    testCategory1 = await prisma.category.create({
      data: {
        nameRu: 'Тестовая категория 1',
        nameEn: 'Test Category 1',
        slug: `test-cat-1-${Date.now()}`,
        promptCount: 0
      }
    })

    testCategory2 = await prisma.category.create({
      data: {
        nameRu: 'Тестовая категория 2',
        nameEn: 'Test Category 2',
        slug: `test-cat-2-${Date.now()}`,
        promptCount: 0
      }
    })

    // Создаём тестового пользователя
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User'
      }
    })
  })

  afterEach(async () => {
    // Очищаем тестовые данные
    if (testPrompt) {
      await prisma.prompt.deleteMany({
        where: { id: testPrompt.id }
      }).catch(() => {})
    }

    await prisma.user.deleteMany({
      where: { id: testUser.id }
    }).catch(() => {})

    await prisma.category.deleteMany({
      where: {
        id: {
          in: [testCategory1.id, testCategory2.id]
        }
      }
    }).catch(() => {})
  })

  describe('createPromptAndSync', () => {
    it('должен создать промпт и увеличить счётчик категории', async () => {
      // Проверяем начальное состояние
      let category = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category?.promptCount).toBe(0)

      // Создаём промпт
      testPrompt = await createPromptAndSync({
        title: 'Test Prompt',
        description: 'Test Description',
        prompt: 'Test Content',
        model: 'GPT-4',
        lang: 'en',
        category: 'test',
        tags: 'test',
        license: 'CC-BY',
        categoryId: testCategory1.id,
        author: {
          connect: { id: testUser.id }
        }
      })

      // Проверяем, что счётчик увеличился
      category = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category?.promptCount).toBe(1)
    })

    it('не должен изменить счётчик если categoryId не указан', async () => {
      // Создаём промпт без категории
      testPrompt = await createPromptAndSync({
        title: 'Test Prompt',
        description: 'Test Description',
        prompt: 'Test Content',
        model: 'GPT-4',
        lang: 'en',
        category: 'test',
        tags: 'test',
        license: 'CC-BY',
        author: {
          connect: { id: testUser.id }
        }
      })

      // Проверяем, что счётчики не изменились
      const category1 = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      const category2 = await prisma.category.findUnique({
        where: { id: testCategory2.id }
      })
      expect(category1?.promptCount).toBe(0)
      expect(category2?.promptCount).toBe(0)
    })
  })

  describe('updatePromptAndSync', () => {
    beforeEach(async () => {
      // Создаём промпт в первой категории
      testPrompt = await createPromptAndSync({
        title: 'Test Prompt',
        description: 'Test Description',
        prompt: 'Test Content',
        model: 'GPT-4',
        lang: 'en',
        category: 'test',
        tags: 'test',
        license: 'CC-BY',
        categoryId: testCategory1.id,
        author: {
          connect: { id: testUser.id }
        }
      })
    })

    it('должен обновить счётчики при смене категории (A -> B)', async () => {
      // Проверяем начальное состояние
      let category1 = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      let category2 = await prisma.category.findUnique({
        where: { id: testCategory2.id }
      })
      expect(category1?.promptCount).toBe(1)
      expect(category2?.promptCount).toBe(0)

      // Меняем категорию
      await updatePromptAndSync(
        { id: testPrompt.id },
        { categoryId: testCategory2.id }
      )

      // Проверяем, что счётчики обновились: A-1, B+1
      category1 = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      category2 = await prisma.category.findUnique({
        where: { id: testCategory2.id }
      })
      expect(category1?.promptCount).toBe(0)
      expect(category2?.promptCount).toBe(1)
    })

    it('не должен изменить счётчик при обновлении без смены categoryId', async () => {
      // Обновляем другие поля
      await updatePromptAndSync(
        { id: testPrompt.id },
        { title: 'Updated Title', description: 'Updated Description' }
      )

      // Проверяем, что счётчик не изменился
      const category1 = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category1?.promptCount).toBe(1)
    })

    it('должен обновить счётчик при удалении категории (A -> null)', async () => {
      // Убираем категорию
      await updatePromptAndSync(
        { id: testPrompt.id },
        { categoryId: null }
      )

      // Проверяем, что счётчик уменьшился
      const category1 = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category1?.promptCount).toBe(0)
    })

    it('должен обновить счётчик при добавлении категории (null -> A)', async () => {
      // Сначала убираем категорию
      await updatePromptAndSync(
        { id: testPrompt.id },
        { categoryId: null }
      )

      // Затем добавляем категорию
      await updatePromptAndSync(
        { id: testPrompt.id },
        { categoryId: testCategory2.id }
      )

      // Проверяем счётчики
      const category1 = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      const category2 = await prisma.category.findUnique({
        where: { id: testCategory2.id }
      })
      expect(category1?.promptCount).toBe(0)
      expect(category2?.promptCount).toBe(1)
    })
  })

  describe('deletePromptAndSync', () => {
    beforeEach(async () => {
      // Создаём промпт в первой категории
      testPrompt = await createPromptAndSync({
        title: 'Test Prompt',
        description: 'Test Description',
        prompt: 'Test Content',
        model: 'GPT-4',
        lang: 'en',
        category: 'test',
        tags: 'test',
        license: 'CC-BY',
        categoryId: testCategory1.id,
        author: {
          connect: { id: testUser.id }
        }
      })
    })

    it('должен удалить промпт и уменьшить счётчик категории', async () => {
      // Проверяем начальное состояние
      let category = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category?.promptCount).toBe(1)

      // Удаляем промпт
      await deletePromptAndSync({ id: testPrompt.id })

      // Проверяем, что счётчик уменьшился
      category = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category?.promptCount).toBe(0)

      // Проверяем, что промпт удалён
      const deletedPrompt = await prisma.prompt.findUnique({
        where: { id: testPrompt.id }
      })
      expect(deletedPrompt).toBeNull()

      // Помечаем, что промпт уже удалён
      testPrompt = null as any
    })

    it('должен бросить ошибку при попытке удалить несуществующий промпт', async () => {
      await expect(
        deletePromptAndSync({ id: 'non-existent-id' })
      ).rejects.toThrow()
    })
  })

  describe('Транзакционность', () => {
    it('должен откатить создание промпта если не удалось обновить категорию', async () => {
      // Используем несуществующую категорию
      const nonExistentCategoryId = 'non-existent-category-id'

      // Попытка создать промпт должна провалиться
      await expect(
        createPromptAndSync({
          title: 'Test Prompt',
          description: 'Test Description',
          prompt: 'Test Content',
          model: 'GPT-4',
          lang: 'en',
          category: 'test',
          tags: 'test',
          license: 'CC-BY',
          categoryId: nonExistentCategoryId,
          author: {
            connect: { id: testUser.id }
          }
        })
      ).rejects.toThrow()

      // Проверяем, что промпт не создался (транзакция откатилась)
      const prompts = await prisma.prompt.findMany({
        where: { authorId: testUser.id }
      })
      expect(prompts.length).toBe(0)
    })
  })

  describe('Множественные операции', () => {
    it('должен корректно обрабатывать создание нескольких промптов в одной категории', async () => {
      // Создаём 3 промпта в одной категории
      const prompts = []
      for (let i = 0; i < 3; i++) {
        const prompt = await createPromptAndSync({
          title: `Test Prompt ${i}`,
          description: 'Test Description',
          prompt: 'Test Content',
          model: 'GPT-4',
          lang: 'en',
          category: 'test',
          tags: 'test',
          license: 'CC-BY',
          categoryId: testCategory1.id,
          author: {
            connect: { id: testUser.id }
          }
        })
        prompts.push(prompt)
      }

      // Проверяем счётчик
      const category = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(category?.promptCount).toBe(3)

      // Удаляем промпты
      for (const prompt of prompts) {
        await deletePromptAndSync({ id: prompt.id })
      }

      // Проверяем, что счётчик обнулился
      const categoryAfter = await prisma.category.findUnique({
        where: { id: testCategory1.id }
      })
      expect(categoryAfter?.promptCount).toBe(0)
    })
  })
})

