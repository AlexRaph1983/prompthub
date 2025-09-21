import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Создаем тестового пользователя
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://via.placeholder.com/150',
    },
  })

  // Создаем тестовые промпты
  const prompts = [
    {
      title: 'SEO-описание товара',
      description: 'Генерируй уникальное SEO-описание для карточки товара.',
      prompt: 'Создай SEO-описание товара по этим параметрам: {название}, {характеристики}, {целевая аудитория}. Описание должно быть уникальным, информативным и оптимизированным для поисковых систем.',
      model: 'GPT-4o',
      lang: 'Русский',
      category: 'SEO',
      tags: 'SEO,e-commerce,описание',
      license: 'CC-BY',
      authorId: user.id,
    },
    {
      title: 'Код-ревьюер',
      description: 'Анализируй код и предлагай улучшения с объяснениями.',
      prompt: 'Act as a senior software engineer and code reviewer. Analyze the following code and provide: 1) Potential bugs or issues 2) Performance improvements 3) Code style suggestions 4) Security concerns. Be thorough but constructive.',
      model: 'Claude 3',
      lang: 'English',
      category: 'Development',
      tags: 'Code,review,development',
      license: 'CC0',
      authorId: user.id,
    },
    {
      title: 'Художественный портрет',
      description: 'Создавай стильные портреты в различных художественных стилях.',
      prompt: 'Создай художественный портрет человека в стиле {художественный_стиль}. Портрет должен быть детализированным, с правильными пропорциями и выразительным взглядом. Используй {цветовая_палитра} для создания атмосферы.',
      model: 'Midjourney',
      lang: 'Русский',
      category: 'Art',
      tags: 'Image,portrait,art',
      license: 'Custom',
      authorId: user.id,
    },
  ]

  // Создаем новые промпты (идемпотентно - не удаляем существующие)
  for (const promptData of prompts) {
    await prisma.prompt.upsert({
      where: {
        title_authorId: {
          title: promptData.title,
          authorId: promptData.authorId,
        }
      },
      update: {
        description: promptData.description,
        prompt: promptData.prompt,
        model: promptData.model,
        lang: promptData.lang,
        category: promptData.category,
        tags: promptData.tags,
        license: promptData.license,
      },
      create: promptData,
    })
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 