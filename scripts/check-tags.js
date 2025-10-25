const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTags() {
  try {
    console.log('Проверяем теги...')
    
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      select: { name: true, promptCount: true }
    })
    
    console.log('Найдено активных тегов:', tags.length)
    console.log('Первые 5 тегов:', tags.slice(0, 5))
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

checkTags().finally(() => prisma.$disconnect())