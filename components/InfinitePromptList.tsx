'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Star, Eye, Loader2, AlertCircle } from 'lucide-react'
import { AuthorProfileBadge } from '@/components/AuthorProfileBadge'
import { PromptCardSkeleton, PromptCardSkeletonList } from '@/components/ui/skeleton'
import { useInfinitePrompts } from '@/lib/hooks/useInfinitePrompts'
import { useIntersection } from '@/lib/hooks/useIntersection'
import { PromptCardDTO } from '@/lib/repositories/promptRepository'

interface InfinitePromptListProps {
  initialPrompts: PromptCardDTO[]
  initialNextCursor: string | null
  authorId?: string
  authorInfo?: {
    id: string
    name: string | null
    image?: string | null
    bio?: string | null
    website?: string | null
    telegram?: string | null
    github?: string | null
    twitter?: string | null
    linkedin?: string | null
    reputationScore?: number | null
    reputationPromptCount?: number | null
    reputationLikesCnt?: number | null
    reputationSavesCnt?: number | null
    reputationRatingsCnt?: number | null
    reputationCommentsCnt?: number | null
  }
  locale: string
  categoryId?: string
  tag?: string
  nsfw?: boolean
}

export default function InfinitePromptList({ 
  initialPrompts, 
  initialNextCursor, 
  authorId, 
  authorInfo,
  locale,
  categoryId,
  tag,
  nsfw
}: InfinitePromptListProps) {
  const t = useTranslations()
  const router = useRouter()
  const [copyStates, setCopyStates] = React.useState<Record<string, { isCopying: boolean; success: boolean }>>({})
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfinitePrompts({ 
    initialPrompts,
    initialNextCursor,
    authorId,
    categoryId,
    tag,
    nsfw
  })

  // Intersection Observer для автоматической загрузки
  const { ref: loadMoreRef, isIntersecting } = useIntersection({
    threshold: 0.1,
    rootMargin: '100px'
  })

  // Автоматическая загрузка при пересечении
  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleCopyPrompt = async (prompt: string, promptId: string) => {
    setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: true, success: false } }))
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: false, success: true } }))
      // Скрываем уведомление через 2 секунды
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: false, success: false } }))
      }, 2000)
      try {
        fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'copy', promptId })
        })
      } catch {}
    } catch (err) {
      console.error('Failed to copy prompt:', err)
      setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: false, success: false } }))
    }
  }

  const handleViewDetails = (promptId: string) => {
    try {
      fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'open', promptId })
      })
    } catch {}
    // Сбрасываем позицию скролла при переходе
    window.scrollTo(0, 0)
    router.push(`/${locale}/prompt/${promptId}`)
  }

  // Объединяем все страницы в один массив
  const allPrompts = data?.pages.flatMap(page => page.items) ?? initialPrompts

  if (isLoading) {
    return <PromptCardSkeletonList count={6} />
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('common.error')}
          </h3>
          <p className="text-gray-500 mb-4">
            {error.message || 'Something went wrong'}
          </p>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            className="text-violet-600 border-violet-600 hover:bg-violet-50"
          >
            {t('common.retry')}
          </Button>
        </div>
      </div>
    )
  }

  if (allPrompts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('prompts.noPrompts')}
          </h3>
          <p className="text-gray-500">
            {t('prompts.beFirstToCreate')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-8">
        {authorId && authorInfo && (
          <AuthorProfileBadge
            className="mb-6"
            author={{
              id: authorInfo.id,
              name: authorInfo.name || 'Anonymous',
              image: authorInfo.image || undefined,
              bio: authorInfo.bio || undefined,
              website: authorInfo.website || undefined,
              telegram: authorInfo.telegram || undefined,
              github: authorInfo.github || undefined,
              twitter: authorInfo.twitter || undefined,
              linkedin: authorInfo.linkedin || undefined,
              reputationScore: authorInfo.reputationScore ?? 0,
              reputationPromptCount: authorInfo.reputationPromptCount ?? 0,
              reputationLikesCnt: authorInfo.reputationLikesCnt ?? 0,
              reputationSavesCnt: authorInfo.reputationSavesCnt ?? 0,
              reputationRatingsCnt: authorInfo.reputationRatingsCnt ?? 0,
              reputationCommentsCnt: authorInfo.reputationCommentsCnt ?? 0,
            }}
          />
        )}

        {/* Список промптов */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {allPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onCopy={handleCopyPrompt}
              onViewDetails={handleViewDetails}
              locale={locale}
              copyState={copyStates[prompt.id]}
            />
          ))}
        </div>

        {/* Лоадер для следующей страницы */}
        {isFetchingNextPage && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <span className="ml-2 text-gray-600">{t('common.loading')}</span>
          </div>
        )}

        {/* Элемент для отслеживания IntersectionObserver */}
        {hasNextPage && !isFetchingNextPage && (
          <div ref={loadMoreRef} className="h-4" />
        )}

        {/* Кнопка "Показать ещё" как fallback */}
        {hasNextPage && !isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <Button 
              onClick={() => fetchNextPage()}
              variant="outline"
              className="text-violet-600 border-violet-600 hover:bg-violet-50"
            >
              {t('prompts.loadMore')}
            </Button>
          </div>
        )}

        {/* Сообщение о достижении конца списка */}
        {!hasNextPage && allPrompts.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('prompts.allLoaded')}
          </div>
        )}
      </div>
    </div>
  )
}

interface PromptCardProps {
  prompt: PromptCardDTO
  onCopy: (prompt: string, promptId: string) => void
  onViewDetails: (promptId: string) => void
  locale: string
  copyState?: { isCopying: boolean; success: boolean }
}

function PromptCard({ prompt, onCopy, onViewDetails, locale, copyState }: PromptCardProps) {
  const t = useTranslations()
  const router = useRouter()

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 break-words flex-1 min-w-0">
            {prompt.title}
          </h3>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {prompt.license}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {prompt.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {prompt.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{prompt.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <span className="whitespace-nowrap">{prompt.model}</span>
            <span aria-hidden="true">•</span>
            <span className="whitespace-nowrap">{prompt.lang}</span>
            {prompt.category && (
              <>
                <span aria-hidden="true">•</span>
                <span className="whitespace-nowrap">{prompt.category}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-violet-600 font-semibold text-sm flex items-center gap-1 whitespace-nowrap">
              <Star className="w-3 h-3 fill-current" />
              {prompt.rating.toFixed(1)}
              <span className="text-gray-500">({prompt.ratingCount})</span>
            </span>
            <span
              title="Unique views with anti-fraud protection"
              className="inline-flex items-center gap-1 text-sm text-gray-500"
            >
              <Eye className="w-3 h-3" />
              {prompt.views}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              By <button
                type="button"
                className="underline hover:text-gray-600"
                onClick={() => prompt.authorId && router.push(`/${locale}/prompts?authorId=${encodeURIComponent(prompt.authorId)}`)}
                disabled={!prompt.authorId}
              >
                {prompt.author}
              </button>
            </span>
          </div>

          {prompt.authorProfile && (
            <div>
              <AuthorProfileBadge author={prompt.authorProfile} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-1 relative">
            <Button
              size="sm"
              disabled={copyState?.isCopying}
              className={`transition-all duration-200 rounded-xl w-full sm:flex-1 ${
                copyState?.success 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : copyState?.isCopying 
                    ? 'bg-violet-400 text-white cursor-not-allowed' 
                    : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
              onClick={() => onCopy(prompt.prompt, prompt.id)}
            >
              <Copy className={`w-4 h-4 mr-1 transition-transform duration-200 ${copyState?.isCopying ? 'animate-pulse' : ''}`} />
              {copyState?.success ? 'Скопировано!' : copyState?.isCopying ? 'Копирование...' : t('common.copyPrompt')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl w-full sm:flex-1"
              onClick={() => onViewDetails(prompt.id)}
            >
              {t('common.details')}
            </Button>
            
            {copyState?.success && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap animate-bounce">
                ✓ Скопировано!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
