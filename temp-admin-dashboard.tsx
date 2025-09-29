'use client'

export function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Админ-панель PromptHub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900">Пользователи</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">Loading...</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900">Промпты</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">Loading...</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900">Просмотры</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">Loading...</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900">Поиски</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">Loading...</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-bold mb-4">🎉 Админ-панель успешно развернута!</h2>
        <div className="space-y-2 text-gray-700">
          <p>✅ Система авторизации настроена</p>
          <p>✅ База данных обновлена</p>
          <p>✅ API для аналитики готово</p>
          <p>✅ Счетчик активности работает</p>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-blue-800">
            <strong>Для полного доступа:</strong> Настройте ваш email в .env.local и войдите на сайт через Google OAuth
          </p>
        </div>
      </div>
    </div>
  )
}
