import { Card, CardContent } from '@/components/ui/card'

export function PromptCardSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header with title and license badge */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-14 animate-pulse"></div>
        </div>

        {/* Model/Lang/Category and Rating */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
        </div>

        {/* Author and buttons */}
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>

          <div className="flex gap-2 mt-1">
            <div className="h-8 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PromptCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PromptCardSkeleton key={i} />
      ))}
    </div>
  )
}
