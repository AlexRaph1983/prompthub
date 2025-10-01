'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Star, Sparkles, Eye } from 'lucide-react'
import { usePromptStore } from '@/contexts/PromptStore'
import { useSearch } from '@/hooks/useSearch'
import { useSearchTracking } from '@/hooks/useSearchTracking'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const t = useTranslations()
  const locale = useLocale()
  const { state, dispatch, getFilteredPrompts, loadMorePrompts } = usePromptStore()
  
  // Ленивый скролл: подгрузка при достижении низа
  React.useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => {
      if (state.isLoading || !state.hasMore) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (scrollY + windowHeight >= docHeight - 200) {
        loadMorePrompts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted, state.isLoading, state.hasMore, loadMorePrompts]);
  const { searchValue, setSearchValue, debouncedValue } = useSearch()
  const { trackSearch, trackClick } = useSearchTracking()
  const { session } = useAuth()
  const router = useRouter()
  const [recommendedPrompts, setRecommendedPrompts] = React.useState<any[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false)
  const [copyStates, setCopyStates] = React.useState<Record<string, { isCopying: boolean; success: boolean }>>({})

  // Восстанавливаем позицию скролла при возврате на страницу
  React.useEffect(() => {
    if (!mounted) return
    
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')
    if (savedScrollPosition) {
      // Небольшая задержка для завершения рендеринга
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition, 10))
        sessionStorage.removeItem('scrollPosition')
      }, 100)
    }
  }, [mounted])

  // синхронизация строки поиска со стором
  React.useEffect(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: debouncedValue })
  }, [debouncedValue, dispatch])

  // Отслеживаем поисковые запросы для аналитики
  React.useEffect(() => {
    if (debouncedValue.trim()) {
      console.log('🔍 HomePage: Tracking search for:', debouncedValue, 'Results:', allPrompts.length)
      trackSearch(debouncedValue, allPrompts.length)
    }
  }, [debouncedValue, allPrompts.length, trackSearch])

  // Сброс пагинации при изменении фильтров
  React.useEffect(() => {
    if (!state.isInitialLoad) {
      dispatch({ type: 'RESET_PAGINATION' })
      // Перезагружаем промпты с новыми фильтрами
      const loadFilteredPrompts = async () => {
        try {
          dispatch({ type: 'SET_LOADING', payload: true })
          
          // Строим URL с фильтрами
          const url = new URL('/api/prompts', window.location.origin)
          url.searchParams.set('limit', '50')
          
          if (state.searchQuery.trim()) {
            url.searchParams.set('q', state.searchQuery.trim())
          }
          if (state.selectedModel) {
            url.searchParams.set('model', state.selectedModel)
          }
          if (state.selectedCategory) {
            url.searchParams.set('category', state.selectedCategory)
          }
          if (state.selectedLang) {
            url.searchParams.set('lang', state.selectedLang)
          }
          
          const response = await fetch(url.toString())
          if (response.ok) {
            const data = await response.json()
            const prompts = data.items || []
            const normalized = Array.isArray(prompts) ? prompts.map((p: any) => ({ ...p, views: p.views || 0 })) : []
            dispatch({ type: 'SET_PROMPTS', payload: normalized })
            dispatch({ 
              type: 'UPDATE_PAGINATION', 
              payload: { 
                hasMore: data.hasMore || false, 
                nextCursor: data.nextCursor || null 
              } 
            })
          }
        } catch (error) {
          console.error('Error loading filtered prompts:', error)
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }
      loadFilteredPrompts()
    }
  }, [state.searchQuery, state.selectedModel, state.selectedCategory, state.selectedLang, dispatch])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const handleCopyPrompt = async (prompt: string, promptId: string) => {
    setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: true, success: false } }))
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: false, success: true } }))
      // Скрываем уведомление через 2 секунды
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [promptId]: { isCopying: false, success: false } }))
      }, 2000)
      // fire-and-forget interaction log
      try { fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'copy', promptId }) }) } catch {}
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
    
    // Отслеживаем клик по результату поиска
    if (debouncedValue.trim()) {
      trackClick(debouncedValue, allPrompts.length, promptId)
    }
    
    // Сохраняем текущую позицию скролла для возврата
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
    sessionStorage.setItem('scrollPosition', scrollPosition.toString())
    router.push(`/${locale}/prompt/${promptId}`)
  }

  // Хелперы фильтрации как в сторе
  const normalizeModel = (value: string): string =>
    value?.toString().toLowerCase().replace(/[^a-z0-9]/g, '') || ''
  const langToCode = (value: string): string => {
    const v = value?.toString().toLowerCase()
    const map: Record<string, string> = {
      english: 'en', en: 'en',
      'русский': 'ru', ru: 'ru', rus: 'ru',
      'espa\u00f1ol': 'es', 'espanol': 'es', es: 'es', spanish: 'es',
      deutsch: 'de', german: 'de', de: 'de',
    }
    return map[v] || v || ''
  }
  const filterByState = (p: any): boolean => {
    const search = state.searchQuery.trim().toLowerCase()
    const selectedModel = normalizeModel(state.selectedModel)
    const selectedLang = langToCode(state.selectedLang)

    const matchesSearch = !search ||
      p.title?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      (Array.isArray(p.tags) && p.tags.some((tag: string) => tag.toLowerCase().includes(search)))

    const matchesModel = !selectedModel || normalizeModel(p.model) === selectedModel
    const matchesCategory = !state.selectedCategory || (Array.isArray(p.tags) && p.tags.map((t: string) => t.toLowerCase()).includes(state.selectedCategory.toLowerCase()))
    const matchesLang = !selectedLang || langToCode(p.lang) === selectedLang

    return matchesSearch && matchesModel && matchesCategory && matchesLang
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
           const prompts = (data || []).slice(0, 6).map((item: any) => {
            const views = typeof item.prompt?.views === 'number' ? item.prompt.views : 0
            const likesCount = (item.prompt as any)?._count?.likes ?? 0

            return ({
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
              score: item.score,
              likesCount,
              views,
            })
           })
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
  
  // Объединяем рекомендованные и обычные промпты (рекомендованные тоже фильтруем)
  const allPrompts = React.useMemo(() => {
    const filteredRecommended = recommendedPrompts.filter(filterByState)

    const recommendedIds = new Set(filteredRecommended.map(p => p.id))
    const regularPrompts = filteredPrompts.filter(p => !recommendedIds.has(p.id))

    return [
      ...filteredRecommended.map(p => ({ ...p, isRecommended: true })),
      ...regularPrompts.map(p => ({ ...p, isRecommended: false })),
    ]
  }, [recommendedPrompts, filteredPrompts, state.searchQuery, state.selectedModel, state.selectedCategory, state.selectedLang])

  if (!mounted) return null
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
              onCopy={handleCopyPrompt}
              onViewDetails={() => handleViewDetails(prompt.id)}
              copyState={copyStates[prompt.id]}
            />
          ))}
          
          {/* Индикатор загрузки */}
          {state.isLoading && state.prompts.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                <span>Загружаем больше промптов...</span>
              </div>
            </div>
          )}
          
          {/* Сообщение о том, что больше нет промптов */}
          {!state.hasMore && state.prompts.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500 text-sm">
                Вы просмотрели все доступные промпты
              </div>
            </div>
          )}
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
    authorId?: string
    likesCount?: number
    views?: number
    isRecommended?: boolean
  }
  onCopy: (prompt: string, promptId: string) => void
  onViewDetails: (promptId: string) => void
}

function PromptCard({ prompt, onCopy, onViewDetails, copyState }: PromptCardProps & { copyState?: { isCopying: boolean; success: boolean } }) {
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
  const views = typeof prompt.views === 'number' ? prompt.views : null

  return (
    <Card className={`shadow-md rounded-2xl p-4 hover:shadow-lg transition flex flex-col gap-2 overflow-hidden ${prompt.isRecommended ? 'border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 shadow-violet-200' : 'bg-white'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {prompt.isRecommended && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span className="sr-only">{t('home.recommended')}</span>
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

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">By <button
            type="button"
            className="underline hover:text-gray-600"
            onClick={() => (prompt as any).authorId && router.push(`/prompts?authorId=${encodeURIComponent((prompt as any).authorId)}`)}
            disabled={!(prompt as any).authorId}
          >{prompt.author}</button></span>
          <div className="flex items-center gap-3">
            <span className="text-violet-600 font-semibold text-sm flex items-center gap-1">
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
    </Card>
  )
}
