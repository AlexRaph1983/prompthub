'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminSession } from '@/lib/admin-auth'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Search, 
  BarChart3, 
  Settings,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminNavigationProps {
  adminSession: AdminSession
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission?: keyof typeof adminSession.admin.permissions
}

export function AdminNavigation({ adminSession }: AdminNavigationProps) {
  const pathname = usePathname()
  
  const navigation: NavigationItem[] = [
    {
      name: 'Дашборд',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Промпты',
      href: '/admin/prompts',
      icon: FileText,
      permission: 'prompts_view',
    },
    {
      name: 'Пользователи',
      href: '/admin/users',
      icon: Users,
      permission: 'users_view',
    },
    {
      name: 'Поисковые запросы',
      href: '/admin/search-analytics',
      icon: Search,
      permission: 'analytics_view',
    },
    {
      name: 'Аналитика',
      href: '/admin/analytics',
      icon: BarChart3,
      permission: 'analytics_view',
    },
    {
      name: 'Настройки',
      href: '/admin/settings',
      icon: Settings,
      permission: 'system_settings',
    },
    {
      name: 'Админы',
      href: '/admin/admins',
      icon: Shield,
      permission: 'admin_manage',
    },
  ]

  const filteredNavigation = navigation.filter(item => {
    if (!item.permission) return true
    return adminSession.admin.permissions[item.permission]
  })

  return (
    <nav className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  isActive ? 'text-blue-700' : 'text-gray-400'
                )} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
        
        {/* Информация о разрешениях */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Разрешения
          </div>
          <div className="space-y-1">
            {Object.entries(adminSession.admin.permissions)
              .filter(([, enabled]) => enabled)
              .slice(0, 5)
              .map(([permission]) => (
                <div key={permission} className="text-xs text-gray-600">
                  • {permission.replace('_', ' ')}
                </div>
              ))}
            {Object.values(adminSession.admin.permissions).filter(Boolean).length > 5 && (
              <div className="text-xs text-gray-500">
                и ещё {Object.values(adminSession.admin.permissions).filter(Boolean).length - 5} разрешений...
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
