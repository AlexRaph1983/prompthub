'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Star, User } from 'lucide-react'
import { usePromptStore } from '@/contexts/PromptStore'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthorProfileBadge } from '@/components/AuthorProfileBadge'

export default function PromptsPage() {
  const t = useTranslations()
  const { getFilteredPrompts } = usePromptStore()
  const { searchValue, setSearchValue } = useSearch()
  const { session } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authorId = searchParams.get('authorId')
  
  const [prompts, setPrompts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [authorInfo, setAuthorInfo] = React.useState<{
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
  } | null>(null)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      try { fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'copy', promptId: (prompt as any).id }) }) } catch {}
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const handleViewDetails = (promptId: string) => {
    try { fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'open', promptId }) }) } catch {}
    router.push(`/prompt/${promptId}`)
  }

  // Загружаем промпты
  React.useEffect(() => {
    const loadPrompts = async () => {
      setIsLoading(true)
      try {
        const url = new URL('/api/prompts', window.location.origin)
        if (authorId) {
          url.searchParams.set('authorId', authorId)
        }
        const response = await fetch(url.toString(), { cache: 'no-store' })
        if (!response.ok) {
          console.error('Failed to load prompts:', response.status)
          return
        }
        const data = await response.json()
        setPrompts(data)
        
        // Если фильтруем по автору, получаем информацию об авторе
        if (authorId && data.length > 0) {
          const firstPrompt = data[0]
          if (firstPrompt.authorProfile) {
            setAuthorInfo({
              name: firstPrompt.authorProfile.name,
              reputationScore: firstPrompt.authorProfile.reputationScore,
              tier: firstPrompt.authorReputationTier || 'bronze',
              bio: firstPrompt.authorProfile.bio,
              website: firstPrompt.authorProfile.website,
              telegram: firstPrompt.authorProfile.telegram,
              github: firstPrompt.authorProfile.github,
              twitter: firstPrompt.authorProfile.twitter,
              linkedin: firstPrompt.authorProfile.linkedin,
              reputationPromptCount: firstPrompt.authorProfile.reputationPromptCount,
              reputationLikesCnt: firstPrompt.authorProfile.reputationLikesCnt,
              reputationSavesCnt: firstPrompt.authorProfile.reputationSavesCnt,
              reputationRatingsCnt: firstPrompt.authorProfile.reputationRatingsCnt,
              reputationCommentsCnt: firstPrompt.authorProfile.reputationCommentsCnt,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load prompts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPrompts()
  }, [authorId])

  // Фильтруем промпты по поиску
  const filteredPrompts = React.useMemo(() => {
    if (!searchValue) return prompts
    const searchLower = searchValue.toLowerCase()
    return prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(searchLower) ||
      prompt.description.toLowerCase().includes(searchLower) ||
      prompt.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
    )
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

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPrompts.length === 0 ? (
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
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

interface PromptCardProps {
  prompt: {
    id: string
    title: string
    description: string
    model: string
    lang: string
    tags: string[]
    rating: number
    ratingCount?: number
    license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
    prompt: string
    author: string
    authorId?: string
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
  }
  onCopy: (prompt: string) => void
  onViewDetails: (promptId: string) => void
}

function PromptCard({ prompt, onCopy, onViewDetails }: PromptCardProps) {
  const t = useTranslations()
  const router = useRouter()

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{prompt.title}</h3>
          <Badge variant="outline" className="text-xs">
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

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{prompt.model}</span>
            <span>•</span>
            <span>{prompt.lang}</span>
          </div>
          <span className="text-violet-600 font-semibold text-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {(prompt.rating ?? 0).toFixed(1)}
            <span className="text-gray-500">({prompt.ratingCount ?? 0})</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">By <button
            type="button"
            className="underline hover:text-gray-600"
            onClick={() => prompt.authorId && router.push(`/prompts?authorId=${encodeURIComponent(prompt.authorId)}`)}
            disabled={!prompt.authorId}
          >{prompt.author}</button></span>
        </div>

        {prompt.authorProfile && (
          <div className="mt-3">
            <AuthorProfileBadge author={prompt.authorProfile} />
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            className="bg-violet-600 text-white hover:bg-violet-700 rounded-xl"
            onClick={() => onCopy(prompt.prompt)}
          >
            <Copy className="w-4 h-4 mr-1" />
            {t('common.copyPrompt')}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-xl"
            onClick={() => onViewDetails(prompt.id)}
          >
            {t('common.details')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 