'use client'

interface AdminChartProps {
  title: string
  data: any[]
  type: 'userGrowth' | 'categories'
}

export function AdminChart({ title, data, type }: AdminChartProps) {
  if (type === 'userGrowth') {
    const maxUsers = Math.max(...data.map(d => d.cumulativeUsers))
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Последние 30 дней</span>
            <span>Всего: {data[data.length - 1]?.cumulativeUsers || 0}</span>
          </div>
          <div className="h-48 flex items-end space-x-1">
            {data.slice(-14).map((day, index) => {
              const height = maxUsers > 0 ? (day.cumulativeUsers / maxUsers) * 100 : 0
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.cumulativeUsers} пользователей (+${day.newUsers})`}
                  />
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                    {new Date(day.date).getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'categories') {
    const maxCount = Math.max(...data.map(d => d.count))
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(0, 8).map((category, index) => {
            const width = maxCount > 0 ? (category.count / maxCount) * 100 : 0
            return (
              <div key={category.category} className="flex items-center">
                <div className="w-20 text-sm text-gray-600 truncate">
                  {category.category}
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
                      {category.count}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{category.averageViews.toFixed(1)} просм.</span>
                    <span>★ {category.averageRating.toFixed(1)}</span>
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
