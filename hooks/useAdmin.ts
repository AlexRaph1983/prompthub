'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export interface AdminInfo {
  isAdmin: boolean
  role: string | null
  permissions: Record<string, boolean>
  loading: boolean
}

export function useAdmin(): AdminInfo {
  const { session, isAuthenticated } = useAuth()
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    isAdmin: false,
    role: null,
    permissions: {},
    loading: true
  })

  useEffect(() => {
    if (!isAuthenticated || !session?.user?.email) {
      setAdminInfo({
        isAdmin: false,
        role: null,
        permissions: {},
        loading: false
      })
      return
    }

    // Проверяем админский email - используем хардкод для yegorovaleksandr@gmail.com
    const adminEmail = 'yegorovaleksandr@gmail.com'
    if (session.user.email?.toLowerCase() === adminEmail.toLowerCase()) {
      setAdminInfo({
        isAdmin: true,
        role: 'super_admin',
        permissions: {
          prompts_view: true,
          prompts_moderate: true,
          prompts_delete: true,
          prompts_edit: true,
          users_view: true,
          users_manage: true,
          users_ban: true,
          analytics_view: true,
          analytics_export: true,
          system_settings: true,
          admin_manage: true,
        },
        loading: false
      })
      return
    }

    // Проверяем в базе данных через API
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check-status')
        if (response.ok) {
          const data = await response.json()
          setAdminInfo({
            isAdmin: data.isAdmin,
            role: data.role,
            permissions: data.permissions || {},
            loading: false
          })
        } else {
          setAdminInfo({
            isAdmin: false,
            role: null,
            permissions: {},
            loading: false
          })
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setAdminInfo({
          isAdmin: false,
          role: null,
          permissions: {},
          loading: false
        })
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, session])

  return adminInfo
}
