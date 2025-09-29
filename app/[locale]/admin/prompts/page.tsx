import { unstable_setRequestLocale } from 'next-intl/server'
import { AdminPromptManagement } from '@/components/admin/AdminPromptManagement'

export const metadata = {
  title: 'Управление промптами | PromptHub',
  description: 'Управление и модерация промптов',
}

export default async function AdminPromptsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  
  return <AdminPromptManagement />
}
