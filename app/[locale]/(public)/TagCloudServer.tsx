import { prisma } from '@/lib/prisma';
import TagCloud from './TagCloud';
import type { Locale } from '@/i18n/index';

interface TagCloudServerProps {
  locale: Locale;
}

export default async function TagCloudServer({ locale }: TagCloudServerProps) {
  try {
    // Получаем топ 20 тегов с количеством промптов
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
        promptCount: {
          gt: 0
        }
      },
      orderBy: {
        promptCount: 'desc'
      },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        promptCount: true,
        color: true
      }
    });

    return <TagCloud locale={locale} tags={tags} />;
  } catch (error) {
    console.error('Error fetching tags for cloud:', error);
    return <TagCloud locale={locale} tags={[]} />;
  }
}
