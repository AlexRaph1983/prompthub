'use client'

import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

interface RecentActivityProps {
  data: {
    prompts: Array<{
      id: string
      title: string
      description: string
      views: number
      rating: number
      author: string
      createdAt: string
    }>
  }
}

export function AdminRecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Последние промпты</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {data.prompts.map((prompt) => (
          <div key={prompt.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/prompts?id=${prompt.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                >
                  {prompt.title}
                </Link>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {prompt.description}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Автор: {prompt.author}</span>
                  <span>{prompt.views} просмотров</span>
                  <span>★ {prompt.rating.toFixed(1)}</span>
                  <span>
                    {formatDistanceToNow(new Date(prompt.createdAt), { 
                      addSuffix: true, 
                      locale: ru 
                    })}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Link
                  href={`/admin/prompts?id=${prompt.id}`}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Просмотреть
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-gray-200">
        <Link
          href="/admin/prompts"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Посмотреть все промпты →
        </Link>
      </div>
    </div>
  )
}
