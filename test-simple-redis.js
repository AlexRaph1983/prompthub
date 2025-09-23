const Redis = require('ioredis-mock')

async function testSimpleRedis() {
  console.log('=== Testing simple Redis mock ===')
  
  try {
    const redis = new Redis()
    console.log('✅ Redis mock created')
    
    // Тестируем простые операции
    await redis.set('test-key', 'test-value', 'EX', 60)
    console.log('✅ Redis set works')
    
    const value = await redis.get('test-key')
    console.log('✅ Redis get works:', value)
    
    await redis.del('test-key')
    console.log('✅ Redis delete works')
    
    console.log('✅ Simple Redis mock works!')
    
  } catch (error) {
    console.error('❌ Redis mock error:', error.message)
  }
}

testSimpleRedis()
