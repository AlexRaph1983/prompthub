const { PrismaClient } = require('@prisma/client')

async function debugViewToken() {
  console.log('=== Debug view token issue ===')
  
  try {
    // Проверяем подключение к БД
    const prisma = new PrismaClient()
    const prompt = await prisma.prompt.findUnique({ 
      where: { id: 'promptmaster-01' }, 
      select: { id: true, title: true } 
    })
    console.log('Prompt found:', prompt)
    
    if (!prompt) {
      console.log('❌ Prompt not found!')
      return
    }
    
    // Проверяем Redis
    const redisModule = require('./lib/redis.ts')
    const redis = await redisModule.getRedis()
    console.log('✅ Redis connected')
    
    // Проверяем функции
    const promptViewService = require('./lib/promptViewService.ts')
    console.log('✅ Functions loaded')
    
    // Тестируем issueViewToken
    const result = await promptViewService.issueViewToken({
      promptId: 'promptmaster-01',
      userId: null,
      fingerprint: 'test-fingerprint-123',
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    })
    
    console.log('✅ View token issued:', result.token)
    console.log('Meta:', result.meta)
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

debugViewToken()
