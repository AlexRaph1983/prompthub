import { unstable_setRequestLocale } from 'next-intl/server'
import { AdminSearchAnalytics } from '@/components/admin/AdminSearchAnalytics'

export const metadata = {
  title: 'Аналитика поиска | PromptHub',
  description: 'Анализ поисковых запросов пользователей',
}

export default async function AdminSearchAnalyticsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  
  return <AdminSearchAnalytics />
}
