import { unstable_setRequestLocale } from 'next-intl/server'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const metadata = {
  title: 'Админ-панель | PromptHub',
  description: 'Панель администратора PromptHub',
}

export default async function AdminPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  
  return <AdminDashboard />
}
