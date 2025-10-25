const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixTagsActive() {
  try {
    console.log('Устанавливаем isActive для всех тегов...')
    
    // Устанавливаем isActive = true для всех тегов
    const result = await prisma.tag.updateMany({
      where: {},
      data: {
        isActive: true
      }
    })
    
    console.log('Обновлено тегов:', result.count)
    
    // Проверяем результат
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      select: { name: true, promptCount: true }
    })
    
    console.log('Активных тегов:', tags.length)
    console.log('Первые 10 тегов:', tags.slice(0, 10))
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

fixTagsActive().finally(() => prisma.$disconnect())
