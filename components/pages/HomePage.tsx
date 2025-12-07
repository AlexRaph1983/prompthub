'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Star, Sparkles, Eye, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { usePromptStore } from '@/contexts/PromptStore'
import { useSearch } from '@/hooks/useSearch'
import { useSearchTracking } from '@/hooks/useSearchTracking'
import { useRealTimeSearchTracking } from '@/hooks/useRealTimeSearchTracking'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SearchBar } from '@/components/SearchBar'
import { getABTestFeatures } from '@/analytics/abTestConfig'
import AutoRefreshWidgets from '@/components/AutoRefreshWidgets'
import { RandomArticlesCarousel } from '@/components/articles/RandomArticlesCarousel'

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
  const { trackSearch, trackCompletedSearch, trackOnBlur, trackClick } = useSearchTracking()
  const { trackRealTimeSearch } = useRealTimeSearchTracking()
  const { session } = useAuth()
  const router = useRouter()
  
  // A/B тест функции
  const abFeatures = getABTestFeatures()
  const [recommendedPrompts, setRecommendedPrompts] = React.useState<any[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = React.useState(false)
  const [copyStates, setCopyStates] = React.useState<Record<string, { isCopying: boolean; success: boolean }>>({})

  // Локальное восстановление скролла ТОЛЬКО для /home,
  // чтобы не конфликтовать с глобальным ScrollRestoration.
  React.useEffect(() => {
    if (!mounted) return

    const lastPromptId = sessionStorage.getItem('homeLastPromptId')
    const savedPos = sessionStorage.getItem('homeScrollPosition')
    if (!lastPromptId && !savedPos) return

    let attempts = 0
    const maxAttempts = 12
    const interval = 80

    const tryRestore = () => {
      attempts += 1

      let target: number | null = null

      if (lastPromptId) {
        const el = document.querySelector<HTMLElement>(`[data-prompt-id="${lastPromptId}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          target = Math.max(0, rect.top + window.scrollY - 100) // учёт хедера
        }
      }

      if (target === null && savedPos) {
        target = parseInt(savedPos, 10)
      }

      if (target !== null) {
        window.scrollTo(0, target)
        sessionStorage.removeItem('homeLastPromptId')
        sessionStorage.removeItem('homeScrollPosition')
        return true
      }

      if (attempts >= maxAttempts) {
        // Не удалось восстановить — чистим, чтобы не мешало
        sessionStorage.removeItem('homeLastPromptId')
        sessionStorage.removeItem('homeScrollPosition')
        return true
      }

      return false
    }

    // Пробуем несколько раз с интервалом — пока прогружается список
    const id = window.setInterval(() => {
      if (tryRestore()) {
        clearInterval(id)
      }
    }, interval)

    // Первая попытка без ожидания
    tryRestore()

    return () => clearInterval(id)
  }, [mounted, state.prompts.length])

  // синхронизация строки поиска со стором
  React.useEffect(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: debouncedValue })
  }, [debouncedValue, dispatch])


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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      // Отслеживаем завершенный поиск при нажатии Enter
      const searchResults = allPrompts.filter(prompt => {
        const search = searchValue.toLowerCase().trim()
        const normalizedSearch = search.replace(/[^\w\s\u0400-\u04FF]/g, ' ')
        
        return prompt.title?.toLowerCase().includes(normalizedSearch) ||
               prompt.description?.toLowerCase().includes(normalizedSearch) ||
               prompt.author?.toLowerCase().includes(normalizedSearch) ||
               (Array.isArray(prompt.tags) && prompt.tags.some((tag: string) => tag.toLowerCase().includes(normalizedSearch)))
      })
      trackCompletedSearch(searchValue, searchResults.length)
    }
  }

  const handleBlur = () => {
    if (searchValue.trim()) {
      // Отслеживаем при потере фокуса
      const searchResults = allPrompts.filter(prompt => {
        const search = searchValue.toLowerCase().trim()
        const normalizedSearch = search.replace(/[^\w\s\u0400-\u04FF]/g, ' ')
        
        return prompt.title?.toLowerCase().includes(normalizedSearch) ||
               prompt.description?.toLowerCase().includes(normalizedSearch) ||
               prompt.author?.toLowerCase().includes(normalizedSearch) ||
               (Array.isArray(prompt.tags) && prompt.tags.some((tag: string) => tag.toLowerCase().includes(normalizedSearch)))
      })
      trackOnBlur(searchValue, searchResults.length)
    }
  }

  // Обработчик для нового SearchBar (Enter/Submit)
  const handleSearchBarSearch = (query: string) => {
    setSearchValue(query)
    // Отслеживаем завершенный поиск при нажатии Enter
    const searchResults = allPrompts.filter(prompt => {
      const search = query.toLowerCase().trim()
      const normalizedSearch = search.replace(/[^\w\s\u0400-\u04FF]/g, ' ')
      
      return prompt.title?.toLowerCase().includes(normalizedSearch) ||
             prompt.description?.toLowerCase().includes(normalizedSearch) ||
             prompt.author?.toLowerCase().includes(normalizedSearch) ||
             (Array.isArray(prompt.tags) && prompt.tags.some((tag: string) => tag.toLowerCase().includes(normalizedSearch)))
    })
    trackCompletedSearch(query, searchResults.length)
  }

  // Обработчик для real-time поиска
  const handleRealTimeSearch = (query: string) => {
    setSearchValue(query)
    
    // Отслеживаем real-time поиск с количеством результатов
    if (query.trim()) {
      const searchResults = allPrompts.filter(prompt => {
        const search = query.toLowerCase().trim()
        const normalizedSearch = search.replace(/[^\w\s\u0400-\u04FF]/g, ' ')
        
        return prompt.title?.toLowerCase().includes(normalizedSearch) ||
               prompt.description?.toLowerCase().includes(normalizedSearch) ||
               prompt.author?.toLowerCase().includes(normalizedSearch) ||
               (Array.isArray(prompt.tags) && prompt.tags.some((tag: string) => tag.toLowerCase().includes(normalizedSearch)))
      })
      
      // Отслеживаем real-time поиск с debounce (1 секунда)
      trackRealTimeSearch(query, searchResults.length, 1000)
    }
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
    
    // Отслеживаем клик по результату поиска, если есть поисковый запрос
    if (debouncedValue.trim() && allPrompts.length > 0) {
      const searchResults = allPrompts.filter(prompt => {
        const search = debouncedValue.toLowerCase()
        return prompt.title?.toLowerCase().includes(search) ||
               prompt.description?.toLowerCase().includes(search) ||
               (Array.isArray(prompt.tags) && prompt.tags.some((tag: string) => tag.toLowerCase().includes(search)))
      })
      trackClick(debouncedValue, searchResults.length, promptId)
    }
    
    // Сохраняем текущую позицию скролла и ID промпта для возврата ТОЛЬКО для /home
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
    sessionStorage.setItem('homeScrollPosition', scrollPosition.toString())
    sessionStorage.setItem('homeLastPromptId', promptId)
    console.log('[HomePage] Saving scroll position:', scrollPosition, 'promptId:', promptId)
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

  // Убираем автоматическое отслеживание при каждом изменении
  // Теперь отслеживаем только завершенные поиски (Enter/blur)

  if (!mounted) return null
  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <AutoRefreshWidgets refreshInterval={10000} />
      <section className="mx-auto max-w-3xl mt-8 px-2">
        <h1 className="text-3xl font-semibold mb-2">{t('home.title')}</h1>
        <p className="text-gray-500 mb-6">{t('home.subtitle')}</p>
        <div className="mb-6">
          <SearchBar
            variant={abFeatures.enhancedPlaceholder ? 'enhanced' : 'default'}
            placeholder={abFeatures.enhancedPlaceholder 
              ? 'Что ищете? Введите жанр, цель или тег — пример: Excel, отчёт, TikTok'
              : t('home.searchPlaceholder')
            }
            showChips={abFeatures.showChips}
            showEmptyState={abFeatures.showEmptyState}
            onSearch={handleSearchBarSearch}
            onRealTimeSearch={handleRealTimeSearch}
            className="w-full"
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

        {/* Карусель полезных статей вместо громоздкого приветственного блока */}
        <RandomArticlesCarousel locale={locale} className="mb-8" />
        
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
                <span>Загружаем больше решений...</span>
              </div>
            </div>
          )}
          
          {/* Сообщение о том, что больше нет промптов */}
          {!state.hasMore && state.prompts.length > 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500 text-sm">
                Вы просмотрели все доступные решения
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
    createdAt?: string
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
    <Card 
      className={`shadow-md rounded-2xl p-4 hover:shadow-lg transition flex flex-col gap-2 overflow-hidden ${prompt.isRecommended ? 'border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 shadow-violet-200' : 'bg-white'}`}
      data-prompt-id={prompt.id}
    >
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {prompt.isRecommended && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex-shrink-0">
            <Sparkles className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="sr-only">{t('home.recommended')}</span>
          </div>
        )}
        <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0">{prompt.model}</span>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0">{prompt.lang}</span>
        <Badge variant={getLicenseVariant(prompt.license)} className="ml-auto text-xs whitespace-nowrap flex-shrink-0">
          {prompt.license}
        </Badge>
      </div>
      <h2 className="font-bold text-lg break-words line-clamp-2 min-w-0">{prompt.title}</h2>
      <div className="text-gray-500 text-sm break-words line-clamp-3 min-w-0">{prompt.description}</div>
      <div className="flex gap-2 mt-1 flex-wrap min-w-0">
        {prompt.tags.map((tag, i) => (
          <span key={i} className="bg-gray-100 rounded px-2 py-0.5 text-xs whitespace-nowrap truncate max-w-full">{tag}</span>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <span className="text-xs text-gray-400 min-w-0">By <button
              type="button"
              className="underline hover:text-gray-600 truncate max-w-[120px] inline-block"
              onClick={() => (prompt as any).authorId && router.push(`/prompts?authorId=${encodeURIComponent((prompt as any).authorId)}`)}
              disabled={!(prompt as any).authorId}
              title={prompt.author}
            >{prompt.author}</button></span>
            {prompt.createdAt && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <time dateTime={prompt.createdAt} suppressHydrationWarning>
                  {formatDistanceToNow(new Date(prompt.createdAt), { 
                    addSuffix: true, 
                    locale: ru 
                  })}
                </time>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-violet-600 font-semibold text-sm flex items-center gap-1 whitespace-nowrap">
              <Star className="w-3 h-3 fill-current flex-shrink-0" />
              {(prompt.rating ?? 0).toFixed(1)}
              <span className="text-gray-500">({prompt.ratingCount ?? 0})</span>
            </span>
            {views !== null && (
              <span
                title="Unique views with anti-fraud protection"
                className="inline-flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap"
              >
                <Eye className="w-3 h-3 flex-shrink-0" />
                {views}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-1 relative min-w-0">
          <Button
            size="sm"
            disabled={copyState?.isCopying}
            className={`transition-all duration-200 rounded-xl w-full sm:flex-1 min-w-0 ${
              copyState?.success 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : copyState?.isCopying 
                  ? 'bg-violet-400 text-white cursor-not-allowed' 
                  : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
            onClick={() => onCopy(prompt.prompt, prompt.id)}
          >
            <Copy className={`w-4 h-4 mr-1 flex-shrink-0 transition-transform duration-200 ${copyState?.isCopying ? 'animate-pulse' : ''}`} />
            <span className="truncate">{copyState?.success ? 'Скопировано!' : copyState?.isCopying ? 'Копирование...' : t('common.copyPrompt')}</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-xl w-full sm:flex-1 min-w-0"
            onClick={() => onViewDetails(prompt.id)}
          >
            <span className="truncate">{t('common.details')}</span>
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
