import TagCloud from './TagCloud';
import type { Locale } from '@/i18n/index';

interface TagCloudServerProps {
  locale: Locale;
}

export default async function TagCloudServer({ locale }: TagCloudServerProps) {
  try {
    // Получаем теги из нашего API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/api/tags`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch tags:', response.status);
      return <TagCloud locale={locale} tags={[]} />;
    }
    
    const tagsData = await response.json();
    
    // Преобразуем формат для совместимости
    const formattedTags = tagsData.map((tag: any, index: number) => ({
      id: `tag-${index}`,
      name: tag.tag,
      slug: tag.tag.toLowerCase().replace(/\s+/g, '-'),
      promptCount: tag.count,
      color: undefined
    }));
    
    return <TagCloud locale={locale} tags={formattedTags} />;
  } catch (error) {
    console.error('Error fetching tags for cloud:', error);
    return <TagCloud locale={locale} tags={[]} />;
  }
}
