const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCount() {
  try {
    const count = await prisma.prompt.count()
    console.log('Промптов в базе:', count)
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCount()
