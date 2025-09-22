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

  if (process.env.NODE_ENV === 'test') {
    const redisMockModule = optionalRequire<any>('ioredis-mock')
    if (!redisMockModule) {
      throw new Error('ioredis-mock is required for test environment but not installed')
    }
    const mock = new redisMockModule.default()
    globalForRedis.__promptHubRedis = mock as unknown as Redis
    return globalForRedis.__promptHubRedis
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
