import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import PromptDetailsClient from './PromptDetailsClient'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = params
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
    
    // Canonical URL (используем RU как default, но промпты не локализованы)
    const canonical = `${baseUrl}/prompt/${id}`
    
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
        index: true,
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

export default function PromptDetailsPage({ params }: PageProps) {
  return <PromptDetailsClient promptId={params.id} />
} 