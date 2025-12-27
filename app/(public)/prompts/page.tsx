import { unstable_setRequestLocale } from 'next-intl/server'
import { Metadata } from 'next'
import InfinitePromptList from '@/components/InfinitePromptList'
import { promptRepository } from '@/lib/repositories/promptRepository'
import { PromptCardDTO } from '@/lib/repositories/promptRepository'
import { prisma } from '@/lib/prisma'

async function getInitialPrompts(authorId?: string): Promise<{
  prompts: PromptCardDTO[]
  nextCursor: string | null
}> {
  try {
    const result = await promptRepository.listPrompts({
      limit: 20,
      cursor: null,
      sort: 'createdAt',
      order: 'desc',
      authorId: authorId || undefined,
    })

    return {
      prompts: result.items,
      nextCursor: result.nextCursor,
    }
  } catch (error) {
    console.error('Error fetching initial prompts:', error)
    return {
      prompts: [],
      nextCursor: null,
    }
  }
}

async function getAuthorInfo(authorId?: string) {
  if (!authorId) return null
  try {
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        telegram: true,
        github: true,
        twitter: true,
        linkedin: true,
        reputationScore: true,
        reputationPromptCount: true,
        reputationLikesCnt: true,
        reputationSavesCnt: true,
        reputationRatingsCnt: true,
        reputationCommentsCnt: true,
      },
    })
    return user
  } catch (error) {
    console.error('Error fetching author info:', error)
    return null
  }
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'
  const isRu = locale === 'ru'
  
  const title = isRu 
    ? 'Каталог промптов — база готовых AI-промптов | PromptHub'
    : 'Prompt Catalog — Ready-to-use AI Prompts | PromptHub'
  
  const description = isRu
    ? 'Найдите подходящий промпт для вашей задачи. Тысячи готовых решений для ChatGPT, Claude, Gemini и других ИИ-инструментов. База промптов с рейтингами и отзывами.'
    : 'Find the perfect prompt for your task. Thousands of ready-to-use solutions for ChatGPT, Claude, Gemini and other AI tools. Prompt database with ratings and reviews.'
  
  const canonical = `${baseUrl}/${locale}/prompts`
  
  return {
    title,
    description,
    keywords: isRu 
      ? 'каталог промптов, база промптов, промпты, ChatGPT, Claude, Gemini, ИИ, нейросети, шаблоны'
      : 'prompt catalog, prompt database, prompts, ChatGPT, Claude, Gemini, AI, templates',
    alternates: {
      canonical,
      languages: {
        ru: `${baseUrl}/ru/prompts`,
        en: `${baseUrl}/en/prompts`,
        'x-default': `${baseUrl}/ru/prompts`
      }
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'PromptHub',
      locale: isRu ? 'ru_RU' : 'en_US',
      type: 'website',
      images: [
        {
          url: `/og/prompt-hub-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/prompt-hub-${locale}.png`]
    },
    robots: {
      index: true,
      follow: true
    }
  }
}

export default async function PromptsPage({
  searchParams,
  params: { locale }
}: {
  searchParams: { authorId?: string }
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  const authorId = searchParams.authorId

  const { prompts, nextCursor } = await getInitialPrompts(authorId)
  const authorInfo = await getAuthorInfo(authorId)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-900">Каталог промптов</h1>
      <p className="text-gray-600 text-lg mb-6">Найдите подходящий промпт для вашей задачи. Тысячи готовых решений для ChatGPT, Claude, Gemini и других ИИ-инструментов.</p>
      
      <InfinitePromptList
        initialPrompts={prompts}
        initialNextCursor={nextCursor}
        authorId={authorId}
        authorInfo={authorInfo as any}
        locale={locale}
      />
    </div>
  )
} 