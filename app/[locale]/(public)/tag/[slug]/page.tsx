import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import InfinitePromptList from '@/components/InfinitePromptList';
import type { Locale } from '@/i18n/index';

interface TagPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  try {
    // Ищем тег по slug или по названию (для обратной совместимости)
    let tag = await prisma.tag.findUnique({
      where: { slug },
      select: { name: true, description: true }
    });

    // Если не найден по slug, ищем по названию
    if (!tag) {
      const decodedSlug = decodeURIComponent(slug);
      tag = await prisma.tag.findFirst({
        where: { 
          OR: [
            { name: decodedSlug },
            { name: { contains: decodedSlug, mode: 'insensitive' } }
          ]
        },
        select: { name: true, description: true }
      });
    }

    if (!tag) {
      return {
        title: t('title'),
        description: t('description')
      };
    }

    const title = `${tag.name} — ${t('title')}`;
    const description = tag.description || `${tag.name} - популярные промпты и шаблоны`;

    return {
      title,
      description,
      alternates: {
        languages: {
          ru: `/ru/tag/${slug}`,
          en: `/en/tag/${slug}`,
          'x-default': `/ru/tag/${slug}`
        }
      },
      robots: {
        index: true,
        follow: true
      }
    };
  } catch (error) {
    console.error('Error generating metadata for tag page:', error);
    return {
      title: t('title'),
      description: t('description')
    };
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'tagPage' });

  try {
    // Ищем тег по slug или по названию (для обратной совместимости)
    let tag = await prisma.tag.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        promptCount: true,
        color: true
      }
    });

    // Если не найден по slug, ищем по названию
    if (!tag) {
      const decodedSlug = decodeURIComponent(slug);
      tag = await prisma.tag.findFirst({
        where: { 
          OR: [
            { name: decodedSlug },
            { name: { contains: decodedSlug, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          promptCount: true,
          color: true
        }
      });
    }

    if (!tag) {
      notFound();
    }

    return (
      <div className="space-y-6">
        {/* Заголовок и описание */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {tag.name}
          </h1>
          {tag.description && (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {tag.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {tag.promptCount} промптов
            </span>
            {tag.color && (
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              ></div>
            )}
          </div>
        </div>

        {/* Список промптов */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('allPrompts')}
          </h2>
          <InfinitePromptList 
            locale={locale}
            tag={slug}
            initialPrompts={[]}
            initialNextCursor={null}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading tag page:', error);
    notFound();
  }
}
