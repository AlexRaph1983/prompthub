'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Star, Sparkles } from 'lucide-react'
import { usePromptStore } from '@/contexts/PromptStore'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const t = useTranslations()
  const { dispatch, getFilteredPrompts } = usePromptStore()
  const { searchValue, setSearchValue, debouncedValue } = useSearch()
  const { session } = useAuth()
  const router = useRouter()
  const [recommendedPrompts, setRecommendedPrompts] = React.useState<any[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false)

  // синхронизация строки поиска со стором
  React.useEffect(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: debouncedValue })
  }, [debouncedValue, dispatch])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      // fire-and-forget interaction log
      try { fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'copy', promptId: (prompt as any).id }) }) } catch {}
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const handleViewDetails = (promptId: string) => {
    try { fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'open', promptId }) }) } catch {}
    router.push(`/prompt/${promptId}`)
  }

  // Загружаем рекомендованные промпты
  React.useEffect(() => {
    let ignore = false
    const loadRecommendations = async () => {
      if (!session?.user?.id) return
      
      setIsLoadingRecommendations(true)
             try {
         const url = new URL('/api/recommendations', window.location.origin)
         url.searchParams.set('for', session.user.id)
         url.searchParams.set('locale', (navigator.language || 'en').startsWith('ru') ? 'ru' : 'en')
         console.log('Fetching recommendations for user:', session.user.id)
         const r = await fetch(url.toString(), { cache: 'no-store' as any })
         console.log('Recommendations response status:', r.status)
         if (!r.ok) {
           console.log('Recommendations API failed:', r.status)
           return
         }
         const data = await r.json()
         console.log('Recommendations data:', data)
         if (!ignore) {
           // Извлекаем данные промптов из ответа API
           const prompts = (data || []).slice(0, 6).map((item: any) => ({
             id: item.id,
             title: item.prompt.title,
             description: item.prompt.description,
             model: item.prompt.model,
             lang: item.prompt.lang,
             tags: item.prompt.tags ? item.prompt.tags.split(',').map((tag: string) => tag.trim()) : [],
             rating: item.prompt.averageRating || 0,
             ratingCount: item.prompt.totalRatings || 0,
             license: item.prompt.license,
             prompt: item.prompt.prompt,
             author: item.prompt.author?.name || 'Unknown',
             authorId: item.prompt.authorId,
             score: item.score
           }))
           console.log('Processed recommended prompts:', prompts)
           setRecommendedPrompts(prompts)
         }
      } catch (error) {
        console.error('Failed to load recommendations:', error)
      } finally {
        if (!ignore) {
          setIsLoadingRecommendations(false)
        }
      }
    }

    loadRecommendations()
    return () => { ignore = true }
  }, [session?.user?.id])

  const filteredPrompts = getFilteredPrompts()
  
  // Объединяем рекомендованные и обычные промпты
  const allPrompts = React.useMemo(() => {
    console.log('Recommended prompts count:', recommendedPrompts.length)
    console.log('Filtered prompts count:', filteredPrompts.length)
    
    const recommendedIds = new Set(recommendedPrompts.map(p => p.id))
    const regularPrompts = filteredPrompts.filter(p => !recommendedIds.has(p.id))
    
    const result = [
      ...recommendedPrompts.map(p => ({ ...p, isRecommended: true })),
      ...regularPrompts.map(p => ({ ...p, isRecommended: false }))
    ]
    
    console.log('Total prompts in feed:', result.length)
    console.log('Recommended prompts in feed:', result.filter(p => p.isRecommended).length)
    
    return result
  }, [recommendedPrompts, filteredPrompts])

  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <section className="mx-auto max-w-3xl mt-8 px-2">
        <h1 className="text-3xl font-semibold mb-2">{t('home.title')}</h1>
        <p className="text-gray-500 mb-6">{t('home.subtitle')}</p>
        <div className="mb-8">
          <Input 
            placeholder={t('home.searchPlaceholder')} 
            className="w-full" 
            value={searchValue}
            onChange={handleSearch}
          />
        </div>
        
        {isLoadingRecommendations && session?.user?.id && (
          <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-200">
            <div className="flex items-center gap-2 text-violet-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Загружаем рекомендации...</span>
            </div>
          </div>
        )}
        
        <div className="grid gap-4">
          {allPrompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              onCopy={() => handleCopyPrompt(prompt.prompt)}
              onViewDetails={() => handleViewDetails(prompt.id)}
            />
          ))}
        </div>
      </section>
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
    isRecommended?: boolean
  }
  onCopy: (prompt: string) => void
  onViewDetails: (promptId: string) => void
}

function PromptCard({ prompt, onCopy, onViewDetails }: PromptCardProps) {
  const t = useTranslations()
  const getLicenseVariant = (license: string) => {
    switch (license) {
      case 'CC-BY': return 'ccby'
      case 'CC0': return 'cc0'
      case 'Custom': return 'custom'
      case 'Paid': return 'paid'
      default: return 'default'
    }
  }
  const router = useRouter()

  return (
    <Card className={`shadow-md rounded-2xl p-4 hover:shadow-lg transition flex flex-col gap-2 overflow-hidden ${prompt.isRecommended ? 'border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 shadow-violet-200' : 'bg-white'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {prompt.isRecommended && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Sparkles className="w-3 h-3" />
            РЕКОМЕНДУЕТСЯ
          </div>
        )}
        <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap">{prompt.model}</span>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap">{prompt.lang}</span>
        <Badge variant={getLicenseVariant(prompt.license)} className="ml-auto text-xs whitespace-nowrap">
          {prompt.license}
        </Badge>
      </div>
      <h2 className="font-bold text-lg break-words">{prompt.title}</h2>
      <div className="text-gray-500 text-sm break-words">{prompt.description}</div>
      <div className="flex gap-2 mt-1 flex-wrap">
        {prompt.tags.map((tag, i) => (
          <span key={i} className="bg-gray-100 rounded px-2 py-0.5 text-xs whitespace-nowrap">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">By <button
          type="button"
          className="underline hover:text-gray-600"
          onClick={() => (prompt as any).authorId && router.push(`/prompts?authorId=${encodeURIComponent((prompt as any).authorId)}`)}
          disabled={!(prompt as any).authorId}
        >{prompt.author}</button></span>
        <span className="text-violet-600 font-semibold text-sm flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          {(prompt.rating ?? 0).toFixed(1)}
          <span className="text-gray-500">({prompt.ratingCount ?? 0})</span>
        </span>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
          <Button
          size="sm"
          className="bg-violet-600 text-white hover:bg-violet-700 rounded-xl flex-1 min-w-0"
          onClick={() => onCopy(prompt.prompt)}
        >
          <Copy className="w-4 h-4 mr-1" />
            {t('common.copyPrompt')}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="rounded-xl flex-1 min-w-0"
          onClick={() => onViewDetails(prompt.id)}
        >
            {t('common.details')}
        </Button>
      </div>
    </Card>
  )
}


