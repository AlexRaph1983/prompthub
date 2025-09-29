import { unstable_setRequestLocale } from 'next-intl/server'

export const metadata = {
  title: 'Настройки системы | PromptHub',
  description: 'Системные настройки и конфигурация',
}

export default async function AdminSettingsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки системы</h1>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              🚧 Страница настроек в разработке
            </div>
            <p className="text-gray-400 mt-2">
              Здесь будут системные настройки и конфигурация
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
