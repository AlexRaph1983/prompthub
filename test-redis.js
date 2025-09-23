async function testRedis() {
  console.log('=== Testing Redis connection ===')
  
  try {
    // Импортируем Redis
    const { getRedis } = require('./lib/redis.ts')
    console.log('✅ Redis module loaded')
    
    // Подключаемся к Redis
    const redis = await getRedis()
    console.log('✅ Redis connected:', typeof redis)
    
    // Тестируем простую операцию
    await redis.set('test-key', 'test-value', 'EX', 60)
    console.log('✅ Redis set operation works')
    
    const value = await redis.get('test-key')
    console.log('✅ Redis get operation works:', value)
    
    await redis.del('test-key')
    console.log('✅ Redis delete operation works')
    
    console.log('✅ All Redis operations successful!')
    
  } catch (error) {
    console.error('❌ Redis error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testRedis()
