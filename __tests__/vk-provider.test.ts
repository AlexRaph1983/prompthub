import { describe, it, expect } from 'vitest'
import VKProvider from '../lib/vk-provider'

describe('VKProvider', () => {
  it('should create provider with correct configuration', () => {
    const provider = VKProvider({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })

    expect(provider.id).toBe('vk')
    expect(provider.name).toBe('VK')
    expect(provider.type).toBe('oauth')
    expect(provider.authorization?.url).toBe('https://oauth.vk.com/authorize')
    expect(provider.token).toBe('https://oauth.vk.com/access_token')
    expect(provider.userinfo?.url).toBe('https://api.vk.com/method/users.get')
  })

  it('should transform VK profile correctly', async () => {
    const provider = VKProvider({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })

    const mockProfile = {
      response: [{
        id: 123456,
        first_name: 'Иван',
        last_name: 'Иванов',
        photo_200: 'https://vk.com/photo200.jpg',
        photo_100: 'https://vk.com/photo100.jpg',
      }],
      email: 'test@example.com'
    }

    const result = await provider.profile!(mockProfile as any, {} as any)

    expect(result.id).toBe('123456')
    expect(result.name).toBe('Иван Иванов')
    expect(result.email).toBe('test@example.com')
    expect(result.image).toBe('https://vk.com/photo200.jpg')
  })

  it('should handle profile without response array', async () => {
    const provider = VKProvider({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })

    const mockProfile = {
      id: 123456,
      first_name: 'Иван',
      last_name: 'Иванов',
      photo_100: 'https://vk.com/photo100.jpg',
      email: 'test@example.com'
    }

    const result = await provider.profile!(mockProfile as any, {} as any)

    expect(result.id).toBe('123456')
    expect(result.name).toBe('Иван Иванов')
    expect(result.email).toBe('test@example.com')
    expect(result.image).toBe('https://vk.com/photo100.jpg')
  })
})
