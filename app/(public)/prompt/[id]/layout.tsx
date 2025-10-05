import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
  params: { id: string }
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = params
  
  try {
    // Загружаем данные промпта для мета-тегов
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/api/prompts/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return {
        title: 'Промпт не найден | PromptHub',
        description: 'Запрашиваемый промпт не найден'
      }
    }
    
    const prompt = await response.json()
    
    // Ограничиваем длину заголовка для SEO (50-60 символов)
    const title = prompt.title.length > 50 
      ? `${prompt.title.substring(0, 47)}... | PromptHub`
      : `${prompt.title} | PromptHub`
    
    const description = prompt.description.length > 155
      ? `${prompt.description.substring(0, 152)}...`
      : prompt.description
    
    return {
      title,
      description,
      keywords: prompt.tags?.join(', ') || '',
      openGraph: {
        title,
        description,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/prompt/${id}`,
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

export default function PromptLayout({ children }: LayoutProps) {
  return <>{children}</>
}
