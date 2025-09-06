import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth"

export interface VKProfile {
  id: number
  first_name: string
  last_name: string
  screen_name?: string
  photo_100?: string
  photo_200?: string
  photo_max_orig?: string
}

export default function VKProvider<P extends VKProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "vk",
    name: "VK",
    type: "oauth",
    authorization: {
      url: "https://oauth.vk.com/authorize",
      params: {
        client_id: options.clientId,
        display: "page",
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/vk`,
        scope: "email",
        response_type: "code",
        v: "5.131"
      }
    },
    token: {
      url: "https://oauth.vk.com/access_token",
      async request({ client, params, checks, provider }) {
        const response = await fetch(provider.token?.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: options.clientId!,
            client_secret: options.clientSecret!,
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/vk`,
            code: params.code!,
          }),
        })
        
        const tokens = await response.json()
        return { tokens }
      }
    },
    userinfo: {
      url: "https://api.vk.com/method/users.get",
      params: {
        fields: "photo_100,photo_200,photo_max_orig,screen_name",
        v: "5.131"
      },
      async request({ tokens, provider }) {
        const response = await fetch(`${provider.userinfo?.url}?${new URLSearchParams({
          access_token: tokens.access_token,
          fields: "photo_100,photo_200,photo_max_orig,screen_name",
          v: "5.131"
        })}`)
        
        const data = await response.json()
        return data
      }
    },
    profile(profile: any, tokens: any) {
      // VK API возвращает массив пользователей, берем первого
      const user = Array.isArray(profile.response) ? profile.response[0] : profile
      return {
        id: user.id.toString(),
        name: `${user.first_name} ${user.last_name}`,
        email: tokens.email,
        image: user.photo_200 || user.photo_100 || user.photo_max_orig,
      }
    },
    ...options,
  }
}
