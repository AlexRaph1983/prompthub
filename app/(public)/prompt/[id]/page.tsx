import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PromptDetailsClient from './PromptDetailsClient'
import { generatePromptStructuredData, generateBreadcrumbSchema } from '@/lib/structured-data'
import type { Locale } from '@/i18n/index'

interface PageProps {
  params: { id: string; locale?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale: routeLocale } = params
  const locale = (routeLocale as Locale | undefined) ?? 'ru'
  const isLocaleRoute = Boolean(routeLocale)
  const canonicalLocale: Locale = 'ru'
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'
  
  try {
    // Загружаем данные промпта напрямую из базы данных
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        tags: true,
        model: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true
          }
        }
      }
    })
    
    if (!prompt) {
      return {
        title: 'Промпт не найден | PromptHub',
        description: 'Запрашиваемый промпт не найден',
        robots: { index: false, follow: false }
      }
    }
    
    // Используем заголовок промпта как основной заголовок страницы
    const title = prompt.title.length > 60 
      ? `${prompt.title.substring(0, 57)}... | PromptHub`
      : `${prompt.title} | PromptHub`
    
    const description = prompt.description.length > 155
      ? `${prompt.description.substring(0, 152)}...`
      : prompt.description
    
    const tags = prompt.tags ? prompt.tags.split(',').map(tag => tag.trim()) : []
    const keywords = [...tags, 'промпты', 'AI промпты', prompt.model].join(', ')
    
    // Canonical URL (используем RU как default, промпты не локализованы)
    const canonical = `${baseUrl}/${canonicalLocale}/prompt/${id}`
    
    return {
      title,
      description,
      keywords,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        type: 'article',
        url: canonical,
        siteName: 'PromptHub',
        locale: 'ru_RU',
        publishedTime: prompt.createdAt.toISOString(),
        modifiedTime: prompt.updatedAt.toISOString(),
        authors: prompt.author.name ? [prompt.author.name] : undefined,
        tags: tags,
        images: [
          {
            url: '/og/prompt-hub.png',
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
        images: ['/og/prompt-hub.png']
      },
      robots: {
        index: isLocaleRoute && locale === canonicalLocale,
        follow: true
      }
    }
  } catch (error) {
    console.error('Error generating metadata for prompt:', error)
    return {
      title: 'Промпт | PromptHub',
      description: 'Просмотр промпта на PromptHub',
      robots: { index: false, follow: true }
    }
  }
}

export default async function PromptDetailsPage({ params }: PageProps) {
  const { id, locale: routeLocale } = params
  const locale = (routeLocale as Locale | undefined) ?? 'ru'
  const canonicalLocale: Locale = 'ru'
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'

  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: {
      author: {
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
        }
      },
      _count: {
        select: {
          likes: true,
          saves: true,
          ratings: true,
          comments: true,
        }
      }
    }
  })

  if (!prompt) {
    notFound()
  }

  const authorScore = prompt.author?.reputationScore ?? 0
  const formattedPrompt = {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    model: prompt.model,
    lang: prompt.lang,
    category: prompt.category,
    tags: prompt.tags ? prompt.tags.split(',').map(tag => tag.trim()) : [],
    rating: prompt.averageRating || 0,
    ratingCount: prompt.totalRatings || 0,
    likesCount: prompt._count.likes,
    savesCount: prompt._count.saves,
    commentsCount: prompt._count.comments,
    license: prompt.license,
    prompt: prompt.prompt,
    author: prompt.author?.name || 'Unknown',
    authorId: prompt.authorId,
    authorReputationScore: authorScore,
    authorReputationTier:
      authorScore >= 85 ? 'platinum' :
      authorScore >= 65 ? 'gold' :
      authorScore >= 40 ? 'silver' : 'bronze',
    authorProfile: prompt.author ? {
      id: prompt.author.id,
      name: prompt.author.name || 'Unknown',
      image: prompt.author.image || undefined,
      bio: prompt.author.bio || undefined,
      website: prompt.author.website || undefined,
      telegram: prompt.author.telegram || undefined,
      github: prompt.author.github || undefined,
      twitter: prompt.author.twitter || undefined,
      linkedin: prompt.author.linkedin || undefined,
      reputationScore: prompt.author.reputationScore || 0,
      reputationPromptCount: prompt.author.reputationPromptCount || 0,
      reputationLikesCnt: prompt.author.reputationLikesCnt || 0,
      reputationSavesCnt: prompt.author.reputationSavesCnt || 0,
      reputationRatingsCnt: prompt.author.reputationRatingsCnt || 0,
      reputationCommentsCnt: prompt.author.reputationCommentsCnt || 0,
    } : undefined,
    instructions: prompt.instructions,
    example: prompt.example,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt?.toISOString(),
  }

  const structuredData = generatePromptStructuredData({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    prompt: prompt.prompt,
    model: prompt.model,
    category: prompt.category,
    tags: prompt.tags || '',
    license: prompt.license,
    author: { name: prompt.author?.name || null },
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  }, canonicalLocale)

  const breadcrumbData = generateBreadcrumbSchema(
    [
      { name: 'Главная', url: `${baseUrl}/${canonicalLocale}/home` },
      { name: 'Промпты', url: `${baseUrl}/${canonicalLocale}/prompts` },
      { name: prompt.title, url: `${baseUrl}/${canonicalLocale}/prompt/${prompt.id}` }
    ],
    canonicalLocale
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <PromptDetailsClient promptId={id} initialPrompt={formattedPrompt} locale={locale} />
    </>
  )
}
