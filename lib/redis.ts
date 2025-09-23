import type { RedisOptions } from 'ioredis'
import Redis from 'ioredis'

const optionalRequire = <T = any>(name: string): T | null => {
  try {
    return (Function('return require')())(name) as T
  } catch (error) {
    return null
  }
}

const globalForRedis = globalThis as unknown as {
  __promptHubRedis?: Redis
}

const lazyRedis = async () => {
  if (globalForRedis.__promptHubRedis) return globalForRedis.__promptHubRedis

  // В development всегда используем mock
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    console.log('Initializing Redis mock for development...')
    try {
      const redisMockModule = optionalRequire<any>('ioredis-mock')
      if (!redisMockModule) {
        console.error('ioredis-mock not found')
        throw new Error('ioredis-mock is required for test/development environment but not installed')
      }
      console.log('ioredis-mock module found')
      const mock = new redisMockModule.default()
      console.log('Redis mock created')
      globalForRedis.__promptHubRedis = mock as unknown as Redis
      console.log('Redis mock stored globally')
      return globalForRedis.__promptHubRedis
    } catch (error) {
      console.error('Failed to initialize Redis mock:', error)
      throw error
    }
  }

  const url = process.env.REDIS_URL
  if (!url) {
    // В dev/тестовой среде позволяем работать без Redis, используя ioredis-mock
    if (process.env.NODE_ENV !== 'production') {
      const redisMockModule = optionalRequire<any>('ioredis-mock')
      if (!redisMockModule) {
        throw new Error('REDIS_URL is not configured and ioredis-mock is not installed')
      }
      const mock = new redisMockModule.default()
      globalForRedis.__promptHubRedis = mock as unknown as Redis
      return globalForRedis.__promptHubRedis
    }
    throw new Error('REDIS_URL is not configured')
  }

  const options: RedisOptions = {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
    enableAutoPipelining: true,
    retryStrategy: (attempt) => Math.min(5000, attempt * 200),
  }

  const client = new Redis(url, options)
  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Redis error', err)
    }
  })
  if (typeof (client as any).connect === 'function') {
    await (client as any).connect()
  }
  globalForRedis.__promptHubRedis = client
  return client
}

export async function getRedis() {
  return lazyRedis()
}

export async function resetRedisForTests() {
  if (process.env.NODE_ENV === 'test' && globalForRedis.__promptHubRedis) {
    await globalForRedis.__promptHubRedis.flushall()
  }
}
