'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Star, Eye } from 'lucide-react'
import { AuthorProfileBadge } from '@/components/AuthorProfileBadge'
import { useSearchTracking } from '@/hooks/useSearchTracking'
import { useRealTimeSearchTracking } from '@/hooks/useRealTimeSearchTracking'

interface Prompt {
  id: string
  title: string
  description: string
  model: string
  lang: string
  tags: string[]
  rating: number
  ratingCount?: number
  likesCount: number
  savesCount: number
  commentsCount: number
  license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
  prompt: string
  author: string
  authorId?: string
  authorReputationScore: number
  authorReputationTier: string
  authorProfile?: {
    id: string
    name: string
    image?: string
    bio?: string
    website?: string
    telegram?: string
    github?: string
    twitter?: string
    linkedin?: string
    reputationScore: number
    reputationPromptCount: number
    reputationLikesCnt: number
    reputationSavesCnt: number
    reputationRatingsCnt: number
    reputationCommentsCnt: number
  }
  createdAt: string
}

interface AuthorInfo {
  name: string
  reputationScore: number
  tier: string
  bio?: string
  website?: string
  telegram?: string
  github?: string
  twitter?: string
  linkedin?: string
  reputationPromptCount: number
  reputationLikesCnt: number
  reputationSavesCnt: number
  reputationRatingsCnt: number
  reputationCommentsCnt: number
}

interface PromptsClientProps {
  prompts: Prompt[]
  authorInfo: AuthorInfo | null
  authorId?: string
  locale: string
}

export default function PromptsClient({ prompts, authorInfo, authorId, locale }: PromptsClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = React.useState('')
  const { trackSearch, trackClick } = useSearchTracking()
  const { trackRealTimeSearch } = useRealTimeSearchTracking()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  // Real-time поиск с debounce для аналитики
  React.useEffect(() => {
    if (searchValue.trim()) {
      trackRealTimeSearch(searchValue, filteredPrompts.length, 1000)
    }
  }, [searchValue, filteredPrompts.length, trackRealTimeSearch])

  const handleCopyPrompt = async (prompt: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      try {
        fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'copy', promptId })
        })
      } catch {}
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const handleViewDetails = (promptId: string) => {
    // Убрано дублирующее отслеживание через /api/interactions
    // Основной просмотр уже учитывается через /api/track-view на странице промпта
    
    // Отслеживаем клик, если есть поисковый запрос
    if (searchValue.trim()) {
      trackClick(searchValue, filteredPrompts.length, promptId)
    }
    
    // Сбрасываем позицию скролла при переходе
    window.scrollTo(0, 0)
    router.push(`/prompt/${promptId}`)
  }

  // Filter prompts by search with normalization
  const filteredPrompts = React.useMemo(() => {
    if (!searchValue) return prompts
    
    const searchLower = searchValue.toLowerCase().trim()
    const normalizedSearch = searchLower.replace(/[^\w\s\u0400-\u04FF]/g, ' ')
    
    const filtered = prompts.filter(prompt => {
      const titleMatch = prompt.title.toLowerCase().includes(normalizedSearch)
      const descriptionMatch = prompt.description.toLowerCase().includes(normalizedSearch)
      const authorMatch = prompt.author.toLowerCase().includes(normalizedSearch)
      const tagsMatch = prompt.tags.some((tag: string) => tag.toLowerCase().includes(normalizedSearch))
      
      return titleMatch || descriptionMatch || authorMatch || tagsMatch
    })
    
    return filtered
  }, [prompts, searchValue])


  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {authorId ? `${t('prompts.authorPrompts')} ${authorInfo?.name || ''}` : t('prompts.allPrompts')}
          </h1>
          {authorInfo && (
            <div className="mb-4">
              <AuthorProfileBadge
                author={{
                  id: authorId || '',
                  name: authorInfo.name,
                  image: undefined,
                  bio: authorInfo.bio,
                  website: authorInfo.website,
                  telegram: authorInfo.telegram,
                  github: authorInfo.github,
                  twitter: authorInfo.twitter,
                  linkedin: authorInfo.linkedin,
                  reputationScore: authorInfo.reputationScore,
                  reputationPromptCount: authorInfo.reputationPromptCount,
                  reputationLikesCnt: authorInfo.reputationLikesCnt,
                  reputationSavesCnt: authorInfo.reputationSavesCnt,
                  reputationRatingsCnt: authorInfo.reputationRatingsCnt,
                  reputationCommentsCnt: authorInfo.reputationCommentsCnt,
                }}
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('common.searchPrompts')}
              value={searchValue}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchValue ? t('prompts.noSearchResults') : t('prompts.noPrompts')}
              </h3>
              <p className="text-gray-500">
                {searchValue ? t('prompts.tryDifferentSearch') : t('prompts.beFirstToCreate')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onCopy={handleCopyPrompt}
                onViewDetails={handleViewDetails}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

interface PromptCardProps {
  prompt: Prompt
  onCopy: (prompt: string, promptId: string) => void
  onViewDetails: (promptId: string) => void
  locale: string
}

function PromptCard({ prompt, onCopy, onViewDetails, locale }: PromptCardProps) {
  const t = useTranslations()
  const router = useRouter()
  const rawViews = (prompt as any).views
  const views = typeof rawViews === 'number' ? rawViews : null

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 break-words">{prompt.title}</h3>
          </div>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {prompt.license}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{prompt.description}</p>

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
            {(prompt as any)?.category && (
              <>
                <span aria-hidden="true">•</span>
                <span className="whitespace-nowrap">{(prompt as any).category}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-violet-600 font-semibold text-sm flex items-center gap-1 whitespace-nowrap">
              <Star className="w-3 h-3 fill-current" />
              {(prompt.rating ?? 0).toFixed(1)}
              <span className="text-gray-500">({prompt.ratingCount ?? 0})</span>
            </span>
            {views !== null && (
              <span
                title="Unique views with anti-fraud protection"
                className="inline-flex items-center gap-1 text-sm text-gray-500"
              >
                <Eye className="w-3 h-3" />
                {views}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>By <button
              type="button"
              className="underline hover:text-gray-600"
              onClick={() => prompt.authorId && router.push(`/${locale}/prompts?authorId=${encodeURIComponent(prompt.authorId)}`)}
              disabled={!prompt.authorId}
            >{prompt.author}</button></span>
          </div>

          {prompt.authorProfile && (
            <div>
              <AuthorProfileBadge author={prompt.authorProfile} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Button
              size="sm"
              className="bg-violet-600 text-white hover:bg-violet-700 rounded-xl w-full sm:flex-1"
              onClick={() => onCopy(prompt.prompt, prompt.id)}
            >
              <Copy className="w-4 h-4 mr-1" />
              {t('common.copyPrompt')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl w-full sm:flex-1"
              onClick={() => onViewDetails(prompt.id)}
            >
              {t('common.details')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

