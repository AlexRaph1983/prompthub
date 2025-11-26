import TagCloud from './TagCloud';
import type { Locale } from '@/i18n/index';
import { prisma } from '@/lib/prisma';

interface TagCloudServerProps {
  locale: Locale;
}

export default async function TagCloudServer({ locale }: TagCloudServerProps) {
  try {
    // Получаем теги напрямую из базы данных
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        promptCount: true,
      },
      orderBy: {
        promptCount: 'desc',
      },
      take: 20, // Топ 20 тегов
    });

    // Фильтруем теги с promptCount > 0
    const formattedTags = tags
      .filter(tag => tag.promptCount > 0)
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        promptCount: tag.promptCount,
        color: tag.color || undefined,
      }));
    
    return <TagCloud locale={locale} tags={formattedTags} />;
  } catch (error) {
    console.error('Error fetching tags for cloud:', error);
    return <TagCloud locale={locale} tags={[]} />;
  }
}
