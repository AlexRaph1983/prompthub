'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, ArrowLeft, Calendar, User, Star, Eye } from 'lucide-react'
import { RatingStars } from '@/components/RatingStars'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { ReviewForm } from '@/components/ReviewForm'
import { ReviewList } from '@/components/ReviewList'
import { useAuth } from '@/hooks/useAuth'
import { usePromptStore } from '@/contexts/PromptStore'
import { useRouter } from 'next/navigation'
import { ViewsService } from '@/lib/services/viewsService'

interface PromptDetailsClientProps {
  promptId: string
}

export default function PromptDetailsClient({ promptId }: PromptDetailsClientProps) {
  const t = useTranslations()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const router = useRouter()
  const { state, dispatch } = usePromptStore()
  const { isAuthenticated, signIn, session } = useAuth() as any
  const [ratingData, setRatingData] = React.useState<{ average: number; count: number; myRating: number | null; canRate?: boolean } | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [pendingRating, setPendingRating] = React.useState<number | null>(null)
  
  const [loadedPrompt, setLoadedPrompt] = React.useState<any>(null)
  const [isLoadingPrompt, setIsLoadingPrompt] = React.useState(false)
  const [promptViews, setPromptViews] = React.useState<number | null>(null)
  
  const prompt = state.prompts.find(p => p.id === promptId) || loadedPrompt
  const isOwner = !!(prompt?.authorId && session?.user?.id && prompt.authorId === session.user.id)
  const [myReview, setMyReview] = React.useState<{ rating: number | null; comment: string | null } | null>(null)
  const [similar, setSimilar] = React.useState<Array<{ id: string; cosine: number }>>([])
  const [copySuccess, setCopySuccess] = React.useState(false)
  const [isCopying, setIsCopying] = React.useState(false)
  const [shareScriptLoaded, setShareScriptLoaded] = React.useState(false)

  const fingerprintRef = React.useRef<string | null>(null)

  // Загружаем промпт через API, если его нет в сторе
  React.useEffect(() => {
    if (!promptId || prompt) return
    
    const loadPrompt = async () => {
      setIsLoadingPrompt(true)
      try {
        const response = await fetch(`/api/prompts/${promptId}`)
        if (response.ok) {
          const promptData = await response.json()
          setLoadedPrompt(promptData)
          // Добавляем промпт в стор для кэширования
          dispatch({ type: 'ADD_PROMPT', payload: promptData })
        }
      } catch (error) {
        console.error('Failed to load prompt:', error)
      } finally {
        setIsLoadingPrompt(false)
      }
    }

    loadPrompt()
  }, [promptId, prompt, dispatch])

  // Загружаем просмотры промпта
  React.useEffect(() => {
    if (!promptId) return
    
    const loadViews = async () => {
      try {
        const response = await fetch(`/api/prompts/${promptId}/views`)
        if (response.ok) {
          const data = await response.json()
          setPromptViews(data.views)
        }
      } catch (error) {
        console.error('Failed to load prompt views:', error)
      }
    }

    loadViews()
  }, [promptId])
  const [fingerprintReady, setFingerprintReady] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setFingerprintReady(true)
      return
    }

    const storageKey = 'ph_view_fp'
    try {
      let stored = window.localStorage.getItem(storageKey)
      if (!stored || stored.length < 16) {
        const fallback = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        stored = fallback.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)
        window.localStorage.setItem(storageKey, stored)
      }
      fingerprintRef.current = stored
    } catch (error) {
      console.warn('Unable to prepare anonymous fingerprint', error)
      fingerprintRef.current = null
    } finally {
      setFingerprintReady(true)
    }
  }, [])

  React.useEffect(() => {
    if (!promptId) return
    console.log('Loading rating data for promptId:', promptId, 'isAuthenticated:', isAuthenticated)
    fetch(`/api/ratings?promptId=${encodeURIComponent(promptId)}`, { credentials: 'include', cache: 'no-store' as any })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        console.log('Rating data loaded:', data)
        setRatingData({ average: data.average, count: data.count, myRating: data.myRating, canRate: data.canRate })
      })
      .catch(() => setRatingData(null))
  }, [promptId, isAuthenticated])

  // Загружаем скрипт Яндекс.Шаринга
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const loadShareScript = () => {
      if (window.Ya && window.Ya.share2) {
        setShareScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://yastatic.net/share2/share.js'
      script.async = true
      script.onload = () => {
        // Ждем инициализации Яндекс.Шаринга
        const checkYaShare = () => {
          if (window.Ya && window.Ya.share2) {
            setShareScriptLoaded(true)
          } else {
            setTimeout(checkYaShare, 100)
          }
        }
        checkYaShare()
      }
      script.onerror = () => {
        console.error('Failed to load Yandex Share script')
      }
      document.head.appendChild(script)
    }

    loadShareScript()
  }, [])

  // Инициализируем кнопки Яндекс.Шаринга после загрузки скрипта
  React.useEffect(() => {
    if (!shareScriptLoaded || typeof window === 'undefined') return

    const initShareButtons = () => {
      if (window.Ya && window.Ya.share2) {
        // Инициализируем кнопки
        const shareContainer = document.getElementById('ya-share-container')
        if (shareContainer) {
          window.Ya.share2(shareContainer, {
            content: {
              url: window.location.href,
              title: prompt?.title || 'PromptHub',
              description: prompt?.description || ''
            }
          })
        }
      }
    }

    // Небольшая задержка для полной инициализации
    const timer = setTimeout(initShareButtons, 200)
    return () => clearTimeout(timer)
  }, [shareScriptLoaded, prompt?.title, prompt?.description])

  // Флаг для предотвращения повторного отслеживания просмотра
  const viewTrackedRef = React.useRef(false)

  React.useEffect(() => {
    if (!promptId || !fingerprintReady) return

    const storageKey = `ph_prompt_viewed_${promptId}`
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey) === '1') {
      return
    }

    // Дополнительная защита от повторного отслеживания
    if (viewTrackedRef.current) {
      return
    }

    let cancelled = false
    let viewAttempted = false

    const trackView = async () => {
      try {
        const tokenResponse = await fetch('/api/view-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cardId: promptId, fingerprint: fingerprintRef.current }),
        })
        if (!tokenResponse.ok) {
          return
        }
        const tokenPayload = await tokenResponse.json().catch(() => null)
        if (!tokenPayload?.viewToken) {
          return
        }

        const trackResponse = await fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cardId: promptId, viewToken: tokenPayload.viewToken }),
        })
        viewAttempted = true
        const payload = await trackResponse.json().catch(() => null)
        if (!cancelled && payload && typeof payload.views === 'number') {
          dispatch({ type: 'UPDATE_PROMPT_VIEWS', payload: { promptId, views: payload.views } })
        }
        // Убрано дублирующее отслеживание просмотра через interactions
        // Основной просмотр уже учитывается через /api/track-view
      } catch (error) {
        console.warn('Failed to track prompt view', error)
      } finally {
        if (!cancelled && viewAttempted && typeof window !== 'undefined') {
          window.sessionStorage.setItem(storageKey, '1')
          viewTrackedRef.current = true // Помечаем, что просмотр уже отслежен
        }
      }
    }

    trackView()

    return () => {
      cancelled = true
    }
  }, [promptId, fingerprintReady, dispatch])

  // log view and load similar prompts
  React.useEffect(() => {
    if (!promptId) return
    ;(async () => {
      try {
        const r = await fetch(`/api/prompts/${encodeURIComponent(promptId)}/similar`, { cache: 'no-store' as any })
        if (!r.ok) return
        const items = await r.json()
        setSimilar(items || [])
      } catch {}
    })()
  }, [promptId])

  const submitRating = React.useCallback(async (value: number) => {
    try {
      setSubmitting(true)
      const prevData = ratingData
      console.log('Submitting rating:', { promptId, value, isAuthenticated, ratingData })
      // Оптимистично подсвечиваем мою оценку и блокируем повторный клик,
      // не меняя среднее и счётчик до ответа сервера
      setRatingData(prev => prev ? { ...prev, myRating: value, canRate: false } : { average: prompt?.rating ?? 0, count: prompt?.ratingCount ?? 0, myRating: value, canRate: false })
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ promptId, value }),
      })
      console.log('Rating response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Rating response data:', data)
        setRatingData({ average: data.average, count: data.count, myRating: data.myRating, canRate: data.canRate })
        dispatch({ type: 'UPDATE_PROMPT_RATING', payload: { promptId: promptId, rating: data.average, ratingCount: data.count } })
      } else {
        if (res.status === 401) {
          console.log('Unauthorized, redirecting to sign in')
          signIn()
        }
        let payload: any = null
        try { payload = await res.json() } catch {}
        console.log('Error response payload:', payload)
        if (payload && typeof payload.average === 'number') {
          setRatingData({ average: payload.average, count: payload.count, myRating: payload.myRating ?? null, canRate: payload.canRate })
          dispatch({ type: 'UPDATE_PROMPT_RATING', payload: { promptId: promptId, rating: payload.average, ratingCount: payload.count } })
        } else {
          setRatingData(prevData ?? null)
          try {
            const r = await fetch(`/api/ratings?promptId=${encodeURIComponent(promptId)}`, { credentials: 'include', cache: 'no-store' as any })
            if (r.ok) {
              const data = await r.json()
              console.log('Refreshed rating data:', data)
              setRatingData({ average: data.average, count: data.count, myRating: data.myRating, canRate: data.canRate })
              dispatch({ type: 'UPDATE_PROMPT_RATING', payload: { promptId: promptId, rating: data.average, ratingCount: data.count } })
            }
          } catch {}
        }
      }
    } finally {
      setSubmitting(false)
      setPendingRating(null)
    }
  }, [dispatch, promptId, ratingData, signIn, isAuthenticated, prompt?.rating, prompt?.ratingCount])

  const handleRate = async (value: number) => {
    console.log('handleRate called:', { value, isAuthenticated, ratingData })
    if (!isAuthenticated) {
      console.log('Not authenticated, setting pending rating')
      setPendingRating(value)
      signIn()
      return
    }
    if (ratingData?.canRate === false || typeof ratingData?.myRating === 'number') {
      console.log('Cannot rate: canRate=false or already rated')
      return
    }
    console.log('Submitting rating...')
    submitRating(value)
  }

  // После успешного логина автоматически применяем отложенную оценку (если она ещё возможна)
  React.useEffect(() => {
    if (!isAuthenticated || pendingRating == null) return
    if (ratingData?.canRate === false || typeof ratingData?.myRating === 'number') return
    console.log('Auto-submitting pending rating after login:', pendingRating)
    submitRating(pendingRating)
  }, [isAuthenticated, pendingRating, ratingData?.canRate, ratingData?.myRating, submitRating])

  const handleCopyPrompt = async (promptText: string) => {
    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(promptText)
      setCopySuccess(true)
      // Скрываем уведомление через 2 секунды
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    } finally {
      setIsCopying(false)
    }
  }

  const handleGoBack = () => {
    router.back()
    // Восстанавливаем позицию скролла после перехода
    setTimeout(() => {
      const savedScrollPosition = sessionStorage.getItem('scrollPosition')
      if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition, 10))
        // Очищаем сохраненную позицию
        sessionStorage.removeItem('scrollPosition')
      }
    }, 100) // Небольшая задержка для завершения навигации
  }

  const handleViewDetails = (promptId: string) => {
    router.push(`/prompt/${promptId}`)
  }

  // Загружаем мой отзыв (если есть) для предзаполнения формы
  React.useEffect(() => {
    let ignore = false
    if (!promptId) return
    fetch(`/api/reviews?promptId=${encodeURIComponent(promptId)}`, { credentials: 'include', cache: 'no-store' as any })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || ignore) return
        const r = data.myReview as any
        if (r) setMyReview({ rating: r.rating ?? null, comment: r.comment ?? null })
      })
      .catch(() => {})
    return () => { ignore = true }
  }, [promptId, isAuthenticated])

  const getLicenseVariant = (license: string) => {
    switch (license) {
      case 'CC-BY': return 'ccby'
      case 'CC0': return 'cc0'
      case 'Custom': return 'custom'
      case 'Paid': return 'paid'
      default: return 'default'
    }
  }

  if (!mounted) return null
  
  if (isLoadingPrompt) {
    return (
      <main className="bg-gray-50 min-h-screen pb-12">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Загружаем промпт...</p>
          </div>
        </div>
      </main>
    )
  }
  
  if (!prompt) {
    return (
      <main className="bg-gray-50 min-h-screen pb-12">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('common.notFound')}</p>
            <Button onClick={handleGoBack} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-12">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button 
          onClick={handleGoBack} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2">
            <Card className="shadow-md rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-lg text-xs font-medium">
                    {prompt.model}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                    {prompt.lang}
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
                    {t(`categories.${prompt.category}`, { fallback: prompt.category })}
                  </span>
                  <Badge variant={getLicenseVariant(prompt.license)} className="ml-auto">
                    {prompt.license}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{prompt.title}</CardTitle>
                <p className="text-gray-500">{prompt.description}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">{t('prompt.prompt')}</h3>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                    {prompt.prompt}
                  </div>
                  
                  {/* Адаптивные кнопки действий */}
                  <div className="mt-4">
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <Button 
                        onClick={() => handleCopyPrompt(prompt.prompt)}
                        disabled={isCopying}
                        size="sm"
                        className={`transition-all duration-200 rounded-xl w-full sm:flex-1 ${
                          copySuccess 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : isCopying 
                              ? 'bg-violet-400 text-white cursor-not-allowed' 
                              : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                      >
                        <Copy className={`w-4 h-4 mr-1 transition-transform duration-200 ${isCopying ? 'animate-pulse' : ''}`} />
                        {copySuccess ? 'Скопировано!' : isCopying ? 'Копирование...' : t('common.copyPrompt')}
                      </Button>
                      
                      <Button 
                        onClick={handleGoBack}
                        size="sm" 
                        variant="outline" 
                        className="rounded-xl w-full sm:flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {t('common.back')}
                      </Button>
                    </div>
                    
                  </div>
                </div>

                {/* Блок "Поделиться промптом" */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Поделиться промптом</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {shareScriptLoaded ? (
                      <div 
                        id="ya-share-container"
                        className="ya-share2" 
                        data-curtain 
                        data-shape="round" 
                        data-limit="3"
                        data-services="vkontakte,odnoklassniki,telegram,whatsapp"
                      ></div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                        <span className="ml-2 text-gray-500">Загружаем кнопки...</span>
                      </div>
                    )}
                  </div>
                </div>

                {prompt.instructions && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">{t('prompt.instructions')}</h3>
                    <p className="text-gray-600">{prompt.instructions}</p>
                  </div>
                )}

                {prompt.example && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">{t('prompt.example')}</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {prompt.example}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {prompt.tags.map((tag, i) => (
                    <span key={i} className="bg-gray-100 rounded px-2 py-1 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Card className="shadow-md rounded-2xl p-6">
              <h3 className="font-semibold mb-4">{t('common.details')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    {t('prompt.author')} {prompt.author}
                    {typeof (prompt as any).authorReputationScore === 'number' && (
                      <UserReputationBadge score={(prompt as any).authorReputationScore} tier={(prompt as any).authorReputationTier || 'bronze'} />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('prompt.rating')}</span>
                  <div className="text-sm text-gray-700">
                    {(ratingData?.average ?? prompt.rating ?? 0).toFixed(1)}
                    <span className="ml-1 text-gray-500">({ratingData?.count ?? prompt.ratingCount ?? 0})</span>
                  </div>
                </div>
                <div className="mt-2">
                  <ReviewForm
                    promptId={promptId}
                    isOwner={isOwner}
                    existingRating={myReview?.rating ?? ratingData?.myRating ?? null}
                    existingComment={myReview?.comment ?? null}
                    locked={Boolean(myReview?.rating ?? ratingData?.myRating)}
                    onSubmitted={({ average, count, rating, comment }) => {
                      setMyReview({ rating, comment })
                      setRatingData(prev => prev ? { ...prev, average, count, myRating: rating, canRate: false } : { average, count, myRating: rating, canRate: false })
                      dispatch({ type: 'UPDATE_PROMPT_RATING', payload: { promptId, rating: average, ratingCount: count } })
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {t('prompt.created')}: <time suppressHydrationWarning>{new Date(prompt.createdAt).toISOString().slice(0,10)}</time>
                  </span>
                </div>
              </div>
            </Card>

            <Card className="shadow-md rounded-2xl p-6">
              <h3 className="font-semibold mb-4">{t('common.license')}</h3>
              <Badge variant={getLicenseVariant(prompt.license)} className="text-sm">
                {prompt.license}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">
                {prompt.license === 'CC-BY' && 'Creative Commons Attribution'}
                {prompt.license === 'CC0' && 'Creative Commons Zero'}
                {prompt.license === 'Custom' && 'Custom'}
                {prompt.license === 'Paid' && 'Paid'}
              </p>
            </Card>
          </div>
          {/* Отзывы */}
          <div className="lg:col-span-2">
            <Card className="shadow-md rounded-2xl p-6">
              <h3 className="font-semibold mb-4">{t('common.reviews')}</h3>
              <ReviewList promptId={promptId} key={`${myReview?.rating ?? ''}-${myReview?.comment ?? ''}`} />
            </Card>

            {similar.length > 0 && (
              <Card className="shadow-md rounded-2xl p-6 mt-6">
                <h3 className="font-semibold mb-4">{t('prompt.similarPrompts')}</h3>
                <div className="grid gap-6">
                  {similar.map((s) => {
                    const p = state.prompts.find((x) => x.id === s.id)
                    if (!p) return null
                    
                    return (
                      <Card key={s.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => router.push(`/prompt/${s.id}`)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{p.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {p.license}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{p.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {p.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{p.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{p.model}</span>
                              <span>•</span>
                              <span>{p.lang}</span>
                            </div>
                            <span className="text-violet-600 font-semibold text-sm flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              {(p.rating ?? 0).toFixed(1)}
                              <span className="text-gray-500">({p.ratingCount ?? 0})</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">By <button
                              type="button"
                              className="underline hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                p.authorId && router.push(`/prompts?authorId=${encodeURIComponent(p.authorId)}`)
                              }}
                              disabled={!p.authorId}
                            >{p.author}</button></span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <Button
                              size="sm"
                              className="bg-violet-600 text-white hover:bg-violet-700 rounded-xl w-full sm:flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyPrompt(p.prompt)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              {t('common.copyPrompt')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-xl w-full sm:flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(p.id)
                              }}
                            >
                              {t('common.details')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Отображение просмотров в нижнем правом углу */}
      {promptViews !== null && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{promptViews}</span>
              <span className="text-xs text-gray-500">просмотров</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
