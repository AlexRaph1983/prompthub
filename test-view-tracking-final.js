const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testViewTrackingFinal() {
  console.log('=== Final view tracking test ===')
  
  // Проверяем текущие просмотры
  const promptmasterPrompt = await prisma.prompt.findFirst({
    where: { authorId: 'promptmaster' },
    select: { id: true, title: true, views: true }
  })
  
  const sunoPrompt = await prisma.prompt.findFirst({
    where: { authorId: 'suno-master-001' },
    select: { id: true, title: true, views: true }
  })
  
  console.log('PromptMaster prompt views:', promptmasterPrompt?.views)
  console.log('Suno Master prompt views:', sunoPrompt?.views)
  
  // Симулируем инкремент просмотров для обоих
  if (promptmasterPrompt) {
    const updated1 = await prisma.prompt.update({
      where: { id: promptmasterPrompt.id },
      data: { views: { increment: 1 } },
      select: { views: true }
    })
    console.log('PromptMaster after increment:', updated1.views)
  }
  
  if (sunoPrompt) {
    const updated2 = await prisma.prompt.update({
      where: { id: sunoPrompt.id },
      data: { views: { increment: 1 } },
      select: { views: true }
    })
    console.log('Suno Master after increment:', updated2.views)
  }
  
  await prisma.$disconnect()
}

testViewTrackingFinal().catch(console.error)
