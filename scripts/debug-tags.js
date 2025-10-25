const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugTags() {
  try {
    console.log('Отладка тегов...')
    
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        promptCount: true,
      },
      take: 10
    })
    
    console.log('Найдено тегов:', tags.length)
    console.log('Теги с promptCount > 0:', tags.filter(t => t.promptCount > 0).length)
    console.log('Первые 5 тегов:', tags.slice(0, 5))
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

debugTags().finally(() => prisma.$disconnect())
