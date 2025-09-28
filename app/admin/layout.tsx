import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { AdminNavigation } from '@/components/admin/AdminNavigation'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminSession = await requireAdmin()
  
  if (!adminSession) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader adminSession={adminSession} />
      <div className="flex">
        <AdminNavigation adminSession={adminSession} />
        <main className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
