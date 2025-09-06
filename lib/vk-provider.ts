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
    token: "https://oauth.vk.com/access_token",
    userinfo: {
      url: "https://api.vk.com/method/users.get",
      params: {
        fields: "photo_100,photo_200,photo_max_orig,screen_name",
        v: "5.131"
      }
    },
    profile(profile: any) {
      // VK API возвращает массив пользователей, берем первого
      const user = Array.isArray(profile.response) ? profile.response[0] : profile
      return {
        id: user.id.toString(),
        name: `${user.first_name} ${user.last_name}`,
        email: profile.email,
        image: user.photo_200 || user.photo_100 || user.photo_max_orig,
      }
    },
    ...options,
  }
}
