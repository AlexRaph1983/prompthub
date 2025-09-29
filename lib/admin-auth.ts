import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextRequest } from 'next/server'

export interface AdminSession {
  user: {
    id: string
    name: string | null
    email: string | null
  }
  admin: {
    id: string
    role: 'admin' | 'moderator' | 'super_admin'
    permissions: Record<string, boolean>
  }
}

export interface AdminPermissions {
  // Управление промптами
  prompts_view: boolean
  prompts_moderate: boolean
  prompts_delete: boolean
  prompts_edit: boolean
  
  // Управление пользователями
  users_view: boolean
  users_manage: boolean
  users_ban: boolean
  
  // Аналитика
  analytics_view: boolean
  analytics_export: boolean
  
  // Система
  system_settings: boolean
  admin_manage: boolean
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  prompts_view: true,
  prompts_moderate: true,
  prompts_delete: false,
  prompts_edit: false,
  users_view: true,
  users_manage: false,
  users_ban: false,
  analytics_view: true,
  analytics_export: false,
  system_settings: false,
  admin_manage: false,
}

const MODERATOR_PERMISSIONS: AdminPermissions = {
  ...DEFAULT_PERMISSIONS,
  prompts_delete: true,
  prompts_edit: true,
}

const ADMIN_PERMISSIONS: AdminPermissions = {
  ...MODERATOR_PERMISSIONS,
  users_manage: true,
  users_ban: true,
  analytics_export: true,
  system_settings: true,
}

const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  ...ADMIN_PERMISSIONS,
  admin_manage: true,
}

export function getPermissionsByRole(role: string): AdminPermissions {
  switch (role) {
    case 'super_admin':
      return SUPER_ADMIN_PERMISSIONS
    case 'admin':
      return ADMIN_PERMISSIONS
    case 'moderator':
      return MODERATOR_PERMISSIONS
    default:
      return DEFAULT_PERMISSIONS
  }
}

export async function requireAdmin(request?: NextRequest): Promise<AdminSession | null> {
  try {
    // Проверяем API ключ для системных запросов
    if (request) {
      const header = request.headers.get('authorization') || request.headers.get('Authorization')
      const apiKey = process.env.ADMIN_API_KEY
      
      if (apiKey && header === `Bearer ${apiKey}`) {
        return {
          user: { id: 'api-key', name: 'API Key', email: 'api@system' },
          admin: { id: 'api-key', role: 'super_admin', permissions: SUPER_ADMIN_PERMISSIONS }
        }
      }
    }

    // Для API routes с request, используем cookies для авторизации
    let session
    if (request) {
      const cookies = request.headers.get('cookie')
      console.log('🔍 API request cookies:', cookies)
      
      if (cookies) {
        // Парсим cookies напрямую
        const cookieObj: Record<string, string> = {}
        cookies.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=')
          if (name && value) {
            cookieObj[name] = value
          }
        })
        
        console.log('🍪 Parsed cookies:', cookieObj)
        
        // Проверяем наличие NextAuth session cookie
        const sessionToken = cookieObj['next-auth.session-token'] || cookieObj['__Secure-next-auth.session-token']
        console.log('🔑 Session token found:', !!sessionToken)
        
        if (sessionToken) {
          // Создаем фиктивный request для getServerSession
          const fakeRequest = {
            headers: {
              get: (name: string) => {
                if (name.toLowerCase() === 'cookie') return cookies
                return request.headers.get(name)
              }
            }
          } as any
          
          try {
            session = await getServerSession({ ...authOptions, req: fakeRequest })
            console.log('✅ Session from cookies:', session?.user?.email)
          } catch (error) {
            console.error('❌ Error getting session:', error)
          }
        }
      }
    } else {
      session = await getServerSession(authOptions)
    }
    
    if (!session?.user?.id) {
      console.log('❌ No session found')
      return null
    }

    // Проверяем админский email из переменной окружения (обратная совместимость)
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail && session.user.email?.toLowerCase() === adminEmail.toLowerCase()) {
      return {
        user: session.user as any,
        admin: { 
          id: 'env-admin', 
          role: 'super_admin', 
          permissions: SUPER_ADMIN_PERMISSIONS 
        }
      }
    }

    // Проверяем в базе данных
    const adminUser = await prisma.adminUser.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!adminUser) {
      return null
    }

    const permissions = adminUser.permissions as AdminPermissions || getPermissionsByRole(adminUser.role)

    return {
      user: {
        id: adminUser.user.id,
        name: adminUser.user.name,
        email: adminUser.user.email,
      },
      admin: {
        id: adminUser.id,
        role: adminUser.role as any,
        permissions,
      }
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

export async function requirePermission(
  permission: keyof AdminPermissions,
  request?: NextRequest
): Promise<AdminSession | null> {
  const adminSession = await requireAdmin(request)
  
  if (!adminSession) {
    return null
  }
  
  if (!adminSession.admin.permissions[permission]) {
    return null
  }
  
  return adminSession
}

export async function createAdminUser(
  userId: string,
  role: 'admin' | 'moderator' | 'super_admin' = 'moderator',
  customPermissions?: Partial<AdminPermissions>,
  createdBy?: string
) {
  const permissions = customPermissions 
    ? { ...getPermissionsByRole(role), ...customPermissions }
    : getPermissionsByRole(role)

  return await prisma.adminUser.create({
    data: {
      userId,
      role,
      permissions,
      createdBy,
    },
    include: { user: true }
  })
}
