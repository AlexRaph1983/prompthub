const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with test data...')

  // Создаём 5 тестовых пользователей
  const users = [
    { id: 'test-user-1', name: 'Alice Developer', email: 'alice@test.com' },
    { id: 'test-user-2', name: 'Bob Coder', email: 'bob@test.com' },
    { id: 'test-user-3', name: 'Charlie Designer', email: 'charlie@test.com' },
    { id: 'test-user-4', name: 'Diana Writer', email: 'diana@test.com' },
    { id: 'test-user-5', name: 'Eve Creator', email: 'eve@test.com' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    })
    console.log(`✅ User created: ${user.name}`)
  }

  // Создаём 20 промптов с разными характеристиками
  const prompts = [
    // Alice - высокий рейтинг, много промптов
    { id: 'prompt-alice-1', title: 'GPT-4 Prompt Engineering Guide', authorId: 'test-user-1', rating: 5, count: 8 },
    { id: 'prompt-alice-2', title: 'Creative Writing Assistant', authorId: 'test-user-1', rating: 4, count: 12 },
    { id: 'prompt-alice-3', title: 'Code Review Helper', authorId: 'test-user-1', rating: 5, count: 15 },
    { id: 'prompt-alice-4', title: 'Data Analysis Template', authorId: 'test-user-1', rating: 4, count: 6 },
    { id: 'prompt-alice-5', title: 'Marketing Copy Generator', authorId: 'test-user-1', rating: 5, count: 10 },

    // Bob - средний рейтинг, среднее количество
    { id: 'prompt-bob-1', title: 'JavaScript Debug Helper', authorId: 'test-user-2', rating: 3, count: 5 },
    { id: 'prompt-bob-2', title: 'Python Data Processing', authorId: 'test-user-2', rating: 4, count: 8 },
    { id: 'prompt-bob-3', title: 'React Component Generator', authorId: 'test-user-2', rating: 3, count: 4 },
    { id: 'prompt-bob-4', title: 'API Documentation Writer', authorId: 'test-user-2', rating: 4, count: 6 },

    // Charlie - низкий рейтинг, мало промптов
    { id: 'prompt-charlie-1', title: 'Basic HTML Template', authorId: 'test-user-3', rating: 2, count: 3 },
    { id: 'prompt-charlie-2', title: 'Simple CSS Helper', authorId: 'test-user-3', rating: 1, count: 2 },

    // Diana - высокий рейтинг, мало промптов
    { id: 'prompt-diana-1', title: 'Advanced AI Research', authorId: 'test-user-4', rating: 5, count: 20 },
    { id: 'prompt-diana-2', title: 'Machine Learning Expert', authorId: 'test-user-4', rating: 5, count: 18 },
    { id: 'prompt-diana-3', title: 'Neural Network Guide', authorId: 'test-user-4', rating: 4, count: 12 },

    // Eve - средний рейтинг, много промптов
    { id: 'prompt-eve-1', title: 'Web Design Patterns', authorId: 'test-user-5', rating: 3, count: 4 },
    { id: 'prompt-eve-2', title: 'Mobile App Templates', authorId: 'test-user-5', rating: 3, count: 6 },
    { id: 'prompt-eve-3', title: 'Database Design Helper', authorId: 'test-user-5', rating: 4, count: 8 },
    { id: 'prompt-eve-4', title: 'UI/UX Guidelines', authorId: 'test-user-5', rating: 3, count: 5 },
    { id: 'prompt-eve-5', title: 'Testing Strategies', authorId: 'test-user-5', rating: 4, count: 7 },
    { id: 'prompt-eve-6', title: 'Deployment Scripts', authorId: 'test-user-5', rating: 3, count: 4 },
    { id: 'prompt-eve-7', title: 'Security Best Practices', authorId: 'test-user-5', rating: 4, count: 9 },
  ]

  for (const promptData of prompts) {
    // Создаём промпт
    const prompt = await prisma.prompt.upsert({
      where: { id: promptData.id },
      update: {},
      create: {
        id: promptData.id,
        title: promptData.title,
        description: `Test prompt: ${promptData.title}`,
        prompt: `You are a helpful assistant. ${promptData.title}`,
        model: 'gpt-4',
        lang: 'en',
        category: 'Text',
        tags: 'test,example',
        license: 'CC-BY',
        authorId: promptData.authorId,
      },
    })

    // Создаём рейтинги для промпта
    const ratings = []
    for (let i = 0; i < promptData.count; i++) {
      // Создаём случайные рейтинги вокруг заданного среднего
      const baseRating = promptData.rating
      const variation = Math.random() - 0.5 // -0.5 to 0.5
      const rating = Math.max(1, Math.min(5, Math.round(baseRating + variation)))
      
      ratings.push({
        value: rating,
        userId: `rater-${promptData.id}-${i}`,
        promptId: prompt.id,
      })
    }

    // Создаём пользователей-оценщиков если их нет
    for (const rating of ratings) {
      await prisma.user.upsert({
        where: { id: rating.userId },
        update: {},
        create: {
          id: rating.userId,
          name: `Rater ${rating.userId}`,
          email: `${rating.userId}@test.com`,
        },
      })
    }

    // Создаём рейтинги
    for (const rating of ratings) {
      await prisma.rating.upsert({
        where: {
          userId_promptId: {
            userId: rating.userId,
            promptId: rating.promptId,
          },
        },
        update: { value: rating.value },
        create: {
          value: rating.value,
          userId: rating.userId,
          promptId: rating.promptId,
        },
      })
    }

    console.log(`✅ Prompt created: ${promptData.title} (${promptData.count} ratings, avg: ${promptData.rating})`)
  }

  console.log('🎉 Database seeded successfully!')
  console.log('\n📊 Test Data Summary:')
  console.log('- 5 users created')
  console.log('- 20 prompts created')
  console.log('- Various rating distributions for testing reputation system')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
