'use client'

interface AdminChartProps {
  title: string
  data: any[]
  type: 'userGrowth' | 'categories' | 'viewsCopies'
}

export function AdminChart({ title, data, type }: AdminChartProps) {
  // Защита от некорректных данных на верхнем уровне
  const safeData = Array.isArray(data) ? data : []
  
  if (type === 'userGrowth') {
    if (safeData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            Нет данных о росте пользователей
          </div>
        </div>
      )
    }
    
    const maxUsers = Math.max(...safeData.map(d => d?.cumulativeUsers || 0), 1)
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Последние 30 дней</span>
            <span>Всего: {safeData[safeData.length - 1]?.cumulativeUsers || 0}</span>
          </div>
          <div className="h-48 flex items-end space-x-1">
            {safeData.slice(-14).map((day, index) => {
              const height = maxUsers > 0 ? ((day?.cumulativeUsers || 0) / maxUsers) * 100 : 0
              return (
                <div key={day?.date || index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${day?.date || ''}: ${day?.cumulativeUsers || 0} пользователей (+${day?.newUsers || 0})`}
                  />
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                    {day?.date ? new Date(day.date).getDate() : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // НОВЫЙ ГРАФИК: Просмотры и копирования по нарастающей
  if (type === 'viewsCopies') {
    // Защита от пустых или некорректных данных
    if (safeData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            Нет данных за последние 30 дней
          </div>
        </div>
      )
    }

    // Защита от деления на ноль
    const dataLen = Math.max(safeData.length, 1)
    const divisor = Math.max(dataLen - 1, 1)
    
    const maxViews = Math.max(...safeData.map(d => d?.cumulativeViews || 0), 1)
    const maxCopies = Math.max(...safeData.map(d => d?.cumulativeCopies || 0), 1)
    const maxValue = Math.max(maxViews, maxCopies, 1)
    
    const lastDay = safeData[safeData.length - 1]
    const totalViews = lastDay?.cumulativeViews || 0
    const totalCopies = lastDay?.cumulativeCopies || 0
    
    // Функция для безопасного вычисления координат
    const getX = (i: number) => (i / divisor) * 600
    const getViewY = (d: any) => 200 - ((d?.cumulativeViews || 0) / maxValue) * 180
    const getCopyY = (d: any) => 200 - ((d?.cumulativeCopies || 0) / maxValue) * 180
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        
        {/* Легенда и итоговые цифры */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Просмотры</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">Копирования</span>
            </div>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <span className="text-purple-600">{totalViews.toLocaleString()} просм.</span>
            <span className="text-emerald-600">{totalCopies.toLocaleString()} копир.</span>
          </div>
        </div>
        
        {/* SVG график с двумя линиями */}
        <div className="relative h-64 w-full">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {/* Горизонтальные линии сетки */}
            <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Область под линией просмотров */}
            <path
              d={`M 0 200 ${safeData.map((d, i) => `L ${getX(i)} ${getViewY(d)}`).join(' ')} L 600 200 Z`}
              fill="url(#purpleGradient)"
              opacity="0.3"
            />
            
            {/* Область под линией копирований */}
            <path
              d={`M 0 200 ${safeData.map((d, i) => `L ${getX(i)} ${getCopyY(d)}`).join(' ')} L 600 200 Z`}
              fill="url(#greenGradient)"
              opacity="0.3"
            />
            
            {/* Линия просмотров */}
            <path
              d={`M ${safeData.map((d, i) => `${getX(i)} ${getViewY(d)}`).join(' L ')}`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Линия копирований */}
            <path
              d={`M ${safeData.map((d, i) => `${getX(i)} ${getCopyY(d)}`).join(' L ')}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Точки на линии просмотров */}
            {safeData.filter((_, i) => i % 5 === 0 || i === safeData.length - 1).map((d, idx) => {
              const originalIndex = safeData.indexOf(d)
              return (
                <circle
                  key={`view-${idx}`}
                  cx={getX(originalIndex)}
                  cy={getViewY(d)}
                  r="4"
                  fill="#8b5cf6"
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
            
            {/* Точки на линии копирований */}
            {safeData.filter((_, i) => i % 5 === 0 || i === safeData.length - 1).map((d, idx) => {
              const originalIndex = safeData.indexOf(d)
              return (
                <circle
                  key={`copy-${idx}`}
                  cx={getX(originalIndex)}
                  cy={getCopyY(d)}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
            
            {/* Градиенты */}
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Подписи осей */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 pt-2">
            {safeData.filter((_, i) => i === 0 || i === Math.floor(safeData.length / 2) || i === safeData.length - 1).map((d, idx) => (
              <span key={idx}>{d?.date?.slice?.(5) || ''}</span>
            ))}
          </div>
        </div>
        
        {/* Дневная статистика под графиком */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Последние 7 дней (ежедневно)</div>
          <div className="grid grid-cols-7 gap-1">
            {safeData.slice(-7).map((d, idx) => (
              <div key={idx} className="text-center">
                <div className="text-[10px] text-gray-400">{d?.date?.slice?.(8) || ''}</div>
                <div className="text-xs font-medium text-purple-600">+{d?.views || 0}</div>
                <div className="text-xs font-medium text-emerald-600">+{d?.copies || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'categories') {
    if (safeData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            Нет данных по категориям
          </div>
        </div>
      )
    }
    
    const maxCount = Math.max(...safeData.map(d => d?.count || 0), 1)
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {safeData.slice(0, 8).map((category, index) => {
            const width = maxCount > 0 ? ((category?.count || 0) / maxCount) * 100 : 0
            return (
              <div key={category?.category || index} className="flex items-center">
                <div className="w-20 text-sm text-gray-600 truncate">
                  {category?.category || 'N/A'}
                </div>
                <div className="flex-1 ml-3">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="ml-2 text-sm text-gray-900 w-8 text-right">
                      {category?.count || 0}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{(category?.averageViews || 0).toFixed(1)} просм.</span>
                    <span>★ {(category?.averageRating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
