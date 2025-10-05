import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import PromptDetailsClient from './PromptDetailsClient'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = params
  
  try {
    // Загружаем данные промпта напрямую из базы данных
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        tags: true,
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
        description: 'Запрашиваемый промпт не найден'
      }
    }
    
    // Ограничиваем длину заголовка для SEO (50-60 символов)
    const title = prompt.title.length > 50 
      ? `${prompt.title.substring(0, 47)}... | PromptHub`
      : `${prompt.title} | PromptHub`
    
    const description = prompt.description.length > 155
      ? `${prompt.description.substring(0, 152)}...`
      : prompt.description
    
    const tags = prompt.tags ? prompt.tags.split(',').map(tag => tag.trim()) : []
    
    return {
      title,
      description,
      keywords: tags.join(', '),
      openGraph: {
        title,
        description,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_APP_HOST || 'https://prompthub.ru'}/prompt/${id}`,
        siteName: 'PromptHub',
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
      }
    }
  } catch (error) {
    console.error('Error generating metadata for prompt:', error)
    return {
      title: 'Промпт | PromptHub',
      description: 'Просмотр промпта на PromptHub'
    }
  }
}

export default function PromptDetailsPage({ params }: PageProps) {
  return <PromptDetailsClient promptId={params.id} />
} 