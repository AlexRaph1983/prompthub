const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testApiResponse() {
  console.log('=== Testing API response for different prompts ===')
  
  // Получаем промпт PromptMaster
  const promptmasterPrompt = await prisma.prompt.findFirst({
    where: { authorId: 'promptmaster' },
    select: { 
      id: true, 
      title: true, 
      authorId: true, 
      views: true,
      viewsCount: true 
    }
  })
  
  console.log('PromptMaster prompt from DB:', promptmasterPrompt)
  
  // Получаем промпт Suno Master
  const sunoPrompt = await prisma.prompt.findFirst({
    where: { authorId: 'suno-master-001' },
    select: { 
      id: true, 
      title: true, 
      authorId: true, 
      views: true,
      viewsCount: true 
    }
  })
  
  console.log('Suno Master prompt from DB:', sunoPrompt)
  
  // Проверяем, есть ли различия в схеме
  console.log('\n--- Schema differences ---')
  const promptmasterFields = Object.keys(promptmasterPrompt || {})
  const sunoFields = Object.keys(sunoPrompt || {})
  
  console.log('PromptMaster fields:', promptmasterFields)
  console.log('Suno Master fields:', sunoFields)
  
  await prisma.$disconnect()
}

testApiResponse().catch(console.error)
