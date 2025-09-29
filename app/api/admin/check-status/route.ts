import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const adminSession = await requireAdmin(request)
    
    if (!adminSession) {
      return NextResponse.json({ 
        isAdmin: false,
        role: null,
        permissions: {}
      })
    }

    return NextResponse.json({
      isAdmin: true,
      role: adminSession.admin.role,
      permissions: adminSession.admin.permissions
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ 
      isAdmin: false,
      role: null,
      permissions: {}
    })
  }
}
