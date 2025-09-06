import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Создаем тестового пользователя
  const testUser = await prisma.user.upsert({
    where: { id: 'test-user-1' },
    update: {},
    create: {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test-rating@example.com',
    },
  })

  // Создаем тестовый промпт
  const testPrompt = await prisma.prompt.upsert({
    where: { id: 'test-prompt-1' },
    update: {},
    create: {
      id: 'test-prompt-1',
      title: 'Тестовый промпт для рейтингов',
      description: 'Этот промпт создан для тестирования системы рейтингов',
      prompt: 'Создай {стиль} изображение с {описание}',
      model: 'Midjourney',
      lang: 'Русский',
      category: 'Image',
      tags: 'test,rating,demo',
      license: 'CC-BY',
      authorId: testUser.id,
    },
  })

  console.log('Seed completed:', { testUser: testUser.id, testPrompt: testPrompt.id })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
