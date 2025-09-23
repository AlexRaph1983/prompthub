const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugPromptViews() {
  console.log('=== Debugging prompt views ===')
  
  // Проверяем промпты PromptMaster
  console.log('\n--- PromptMaster prompts ---')
  const promptmasterPrompts = await prisma.prompt.findMany({
    where: { authorId: 'promptmaster' },
    select: { 
      id: true, 
      title: true, 
      authorId: true, 
      views: true,
      createdAt: true 
    },
    take: 3
  })
  console.log(promptmasterPrompts)
  
  // Проверяем промпты Suno Master
  console.log('\n--- Suno Master prompts ---')
  const sunoPrompts = await prisma.prompt.findMany({
    where: { authorId: 'suno-master-001' },
    select: { 
      id: true, 
      title: true, 
      authorId: true, 
      views: true,
      createdAt: true 
    },
    take: 3
  })
  console.log(sunoPrompts)
  
  // Проверяем схему таблицы
  console.log('\n--- Database schema info ---')
  const tableInfo = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'Prompt' AND column_name = 'views'
  `
  console.log('Views column info:', tableInfo)
  
  await prisma.$disconnect()
}

debugPromptViews().catch(console.error)
